

namespace dotnet_reactjs.Core
{
    using Newtonsoft.Json;
    using PcapDotNet.Core;
    using PcapDotNet.Packets;
    using QuikGraph;
    using System.Collections.Concurrent;
    using dotnet_reactjs.Utils;
    using System.Collections.Generic;
    using UAParser;
    using PcapDotNet.Packets.Dns;

    // Extracting Os from certain sources has more priority than other sources
    // The lower, the more priority it has
    public enum OsSetPriority
    {
        FromHttpRequest,
        None
    };

    class InteractionData
    {

    }

    class ConcurrentEntityData
    {
        private OsSetPriority _priority = OsSetPriority.None;
        private object _lock = new object();

        public readonly HashSet<string> Services = new HashSet<string>();
        public string? Ip { get; private set; }
        public string? Hostname { get; private set; }
        public string? Domain { get; private set; }
        public string? Mac { get; private set; }
        public string? Os { get; private set; }

        public string Type = "Computer";

        public ConcurrentEntityData(string ip)
        {
            Ip = ip;
        }

        public void SetOs(string os, OsSetPriority priority)
        {
            if (os == null)
            {
                return;
            }

            lock (_lock)
            {
                if (priority < _priority)
                {
                    _priority = priority;
                    Os = os;
                }
            }
        }

        public void SetHostname(string hostname)
        {
            lock (_lock)
            {
                Hostname = hostname;
            }
        }
    }

    public class PcapAnalyzer
    {
        private const int ThreadCount = 10;
        private static readonly Dictionary<ushort, string> TcpPortToServiceName = new Dictionary<ushort, string>()
        {
            { 20, "FTP" },
            { 21, "FTP" },
            { 22, "SSH" },
            { 23, "TELNET" },
            { 25, "SMTP" },
            { 80, "HTTP" },
            { 79, "Finger" },
            { 88, "Kerberos" },
            { 115, "SFTP" },
            { 137, "NetBIOS" },
            { 264, "BGMP" },
            { 389, "LDAP" },
            { 443, "HTTPS" },
            { 465, "AuthSNMP" },
            { 636, "LDAPS" }
        };

        private static readonly Dictionary<ushort, string> UdpPortToServiceName = new Dictionary<ushort, string>()
        {
            { 53, "DNS" },
            { 67, "DHCP" },
            { 264, "BGMP" },
            { 161, "SNMP" }
        };

        private static readonly HashSet<string> ServicesThatMakeYouAServer = new HashSet<string>
        {
            "DNS", "HTTP", "HTTPS"
        };

        private readonly ConcurrentDictionary<string, string> _hosts = new ConcurrentDictionary<string, string>();
        private readonly ConcurrentBag<string> _gateways = new ConcurrentBag<string>();
        private readonly ConcurrentDictionary<string, ConcurrentEntityData> _entities = new ConcurrentDictionary<string, ConcurrentEntityData>();
        private readonly ConcurrentDictionary<(string, string), int> _interactions = new ConcurrentDictionary<(string, string), int>();
        private readonly List<Packet> _packets = new List<Packet>();
        private readonly string _filePath;

        public PcapAnalyzer(string filePath)
        {
            _filePath = filePath;
        }

        public async Task<string> GenerateCytoscapeGraphJson()
        {
            // Optimization: add BPF filters
            OfflinePacketDevice selectedDevice = new OfflinePacketDevice(_filePath);
            using (PacketCommunicator communicator =
                selectedDevice.Open(65536,                                  // Portion of the packet to capture
                                                                            // 65536 guarantees that the whole packet will be captured on all the link layers
                                    PacketDeviceOpenAttributes.Promiscuous, // Promiscuous mode
                                    1000))                                  // Read timeout
            {
                // Read all packets to memory
                communicator.ReceivePackets(0, AggregatePacketToMemory);
            }

            // Process in parallel
            await AnalyzeAggregatedPacketsInParallel(ThreadCount);
            await DoFinalProcessingOnData(ThreadCount);
            return GenerateCytoscapeGraphJsonFromAnalysis();
        }

        private string GenerateCytoscapeGraphJsonFromAnalysis()
        {
            var edges = _interactions.Select(interaction => new UndirectedEdge<string>(interaction.Key.Item1, interaction.Key.Item2)).ToList();

            var networkGraph = new UndirectedGraph<string, UndirectedEdge<string>>();
            networkGraph.AddVerticesAndEdgeRange(edges);

            // Generate graph JSON
            var graphClass = new
            {
                Entities = _entities.Select(kvp => new object[] { kvp.Key, kvp.Value }),
                Interactions = networkGraph.Edges.Select(edge => new string[] { edge.Source, edge.Target })
            };

            return JsonConvert.SerializeObject(graphClass);
        }

        private void AggregatePacketToMemory(Packet packet)
        {
            // Optimization: schedule for thread to process immediately when
            // N packets are aggregated (N = totalPackets/threadCount + 1)
            _packets.Add(packet);
        }

        private async Task DoFinalProcessingOnData(int threadCount)
        {
            var entities = _entities.ToArray();
            int chunkSize = entities.Length / threadCount + 1;
            await Task.WhenAll(Enumerable.Range(0, threadCount).Select(i =>
            {
                return Task.Run(() =>
                {
                    int start = i * chunkSize;
                    int end = i * chunkSize + chunkSize;
                    for (int i = start; i < end; i++)
                    {
                        if (i >= entities.Length)
                        {
                            break;
                        }

                        // Check if entity provides services that are server-like
                        foreach (var service in entities[i].Value.Services)
                        {
                            if (ServicesThatMakeYouAServer.Contains(service))
                            {
                                entities[i].Value.Type = "Server";
                                break;
                            }
                        }
                    }
                });
            }));
        }

        private async Task AnalyzeAggregatedPacketsInParallel(int threadCount)
        {
            var packets = _packets.ToArray();
            int chunkSize = packets.Length / threadCount + 1;

            await Task.WhenAll(Enumerable.Range(0, threadCount).Select(i =>
            {
                return Task.Run(() => AnalyzePackets(packets, i * chunkSize, chunkSize));
            }));
        }

        private void AnalyzePackets(Packet[] packets, int start, int count)
        {
            int end = start + count;
            for (int i = start; i < end; i++)
            {
                if (i >= packets.Length)
                {
                    break;
                }

                AnalyzePacket(packets[i]);
            }
        }

        private void AnalyzePacket(Packet packet)
        {
            // Make sure this is at start to first add source Ip if present
            TryExtractEntity(packet);

            TryExtractInteraction(packet);
            TryExtractDeviceProvidedService(packet);
            TryExtractOsFromHttp(packet);
            TryExtractHostnameFromDnsResponse(packet);
        }

        private void TryExtractHostnameFromDnsResponse(Packet packet)
        {
            if (!packet.IsUdp())
            {
                return;
            }

            if (packet.Ethernet.IpV4.Udp.SourcePort != 53)
            {
                return;
            }

            if (!(packet?.Ethernet?.IpV4?.Udp?.Dns?.IsValid ?? false))
            {
                return;
            }

            var dns = packet.Ethernet.IpV4.Udp.Dns;
            if (!dns.IsResponse)
            {
                return;
            }

            if (dns.Answers == null)
            {
                return;
            }

            foreach (var answer in dns.Answers)
            {
                if (answer.DnsType != DnsType.A || answer.DnsClass != DnsClass.Internet)
                {
                    continue;
                }

                if (answer.Data == null)
                {
                    continue;
                }

                // TODO: add type=dns_query to interaction between DNS client and queried target
                string hostname = answer.DomainName.ToString();
                if (hostname.Last() == '.')
                {
                    hostname = hostname.Remove(hostname.Length - 1);
                }

                if (hostname.EndsWith(".local"))
                {
                    hostname = hostname.Remove(hostname.Length - ".local".Length);
                }

                string ip = ((DnsResourceDataIpV4)answer.Data).Data.ToString();
                if (!_entities.ContainsKey(ip))
                {
                    _entities[ip] = new ConcurrentEntityData(ip);
                }

                _entities[ip].SetHostname(hostname);
            }
        }

        private void TryExtractOsFromHttp(Packet packet)
        {
            if (!packet.HasIpLayer())
            {
                return;
            }

            if (packet.Ethernet.IpV4.Source.IsMiscIp() || packet.Ethernet.IpV4.Destination.IsMiscIp())
            {
                return;
            }

            if (!(packet?.Ethernet?.IpV4?.Tcp?.Http?.IsValid ?? false))
            {
                return;
            }

            // Note: later on in method there might be a race-condition on entity.Os, not critical
            if (_entities[packet.Ethernet.IpV4.Source.ToString()].Os != null)
            {
                return;
            }

            var http = packet.Ethernet.IpV4.Tcp.Http;
            if (!http.IsRequest)
            {
                return;
            }

            string? userAgent = http?.Header?.FirstOrDefault(field => field.Name == "User-Agent" && field.ValueString.Contains("Windows"))?.ValueString;
            if (userAgent == null)
            {
                return;
            }

            Parser userAgentParser = Parser.GetDefault();
            ClientInfo clientInfo = userAgentParser.Parse(userAgent);
            if (clientInfo.OS != null)
            {
                _entities[packet.Ethernet.IpV4.Source.ToString()].SetOs(clientInfo.OS.ToString(), OsSetPriority.FromHttpRequest);
            }
        }

        private void TryExtractEntity(Packet packet)
        {
            if (!packet.HasIpLayer())
            {
                return;
            }

            string sourceIp = packet.Ethernet.IpV4.Source.ToString();
            string destinationIp = packet.Ethernet.IpV4.Destination.ToString();

            if (!sourceIp.IsMiscIp())
            {
                _entities.TryAdd(sourceIp, new ConcurrentEntityData(sourceIp));
            }

            if (!destinationIp.IsMiscIp())
            {
                _entities.TryAdd(destinationIp, new ConcurrentEntityData(destinationIp));
            }
        }

        private void TryExtractInteraction(Packet packet)
        {
            if (!packet.HasIpLayer())
            {
                return;
            }

            var sourceIp = packet.Ethernet.IpV4.Source.ToString();
            var destIp = packet.Ethernet.IpV4.Destination.ToString();

            if (sourceIp.IsMiscIp() || destIp.IsMiscIp())
            {
                return;
            }

            // Compare to avoid adding same edge twice
            // Dicationary is used to do atomic [check if present] + [add]
            _interactions[sourceIp.CompareTo(destIp) < 0 ? (sourceIp, destIp) : (destIp, sourceIp)] = 0;
        }

        private void TryExtractDeviceProvidedService(Packet packet)
        {
            if (!packet.IsTcp() && !packet.IsUdp())
            {
                return;
            }

            // TODO: find better criteria? (some service ports may be above 1023)
            if (packet.Ethernet.IpV4.Tcp.SourcePort > 1024)
            {
                return;
            }

            if (packet.IsTcp())
            {
                if (!packet.Ethernet.IpV4.Tcp.IsAcknowledgment)
                {
                    return;
                }

                ushort port = packet.Ethernet.IpV4.Tcp.SourcePort;
                if (TcpPortToServiceName.ContainsKey(port))
                {
                    _entities[packet.Ethernet.IpV4.Source.ToString()].Services.Add(TcpPortToServiceName[port]);
                }
            }
            else
            {
                ushort port = packet.Ethernet.IpV4.Udp.SourcePort;
                if (UdpPortToServiceName.ContainsKey(port))
                {
                    _entities[packet.Ethernet.IpV4.Source.ToString()].Services.Add(UdpPortToServiceName[port]);
                }
            }
        }
    }
}

