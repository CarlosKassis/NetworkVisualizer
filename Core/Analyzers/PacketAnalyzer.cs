

#pragma warning disable CS8600 // Converting null literal or possible null value to non-nullable type.

namespace NetworkAnalyzer.Core.Analyzers
{
    using Newtonsoft.Json;
    using PcapDotNet.Core;
    using PcapDotNet.Packets;
    using System.Collections.Concurrent;
    using NetworkAnalyzer.Utils;
    using System.Collections.Generic;
    using System.Numerics;
    using UAParser;
    using PcapDotNet.Packets.Dns;
    using NetworkAnalyzer.Utils.Dhcp;
    using NetworkAnalyzer.Utils.Dhcp.Options;
    using NetworkAnalyzer.Utils.Dhcp.Enums;
    using System.Net;
    using System.Text;
    using System.Linq;

    // Extracting Os from certain sources has more priority than other sources
    // The lower, the more priority it has
    public enum OsSetPriority
    {
        FromHttpRequest,
        FromHostnameDesktopSlash,
        FromSSDP,
        None
    };

    // Extracting Mac from certain sources has more priority than other sources
    // The lower, the more priority it has
    public enum MacSetPriority
    {
        FromARP,
        FromDHCP,
        None
    };

    public enum DomainSetPriority
    {
        FromActiveDirectory,
        FromSubnet,
        FromOtherMachinesHostnamesInSubnet, // TODO: remove
        None
    }

    // Need to always sync this with frontend enums
    // Lower values get higher priority
    public enum EntityType
    {
        Gateway,
        DHCP,
        DNS,
        Server,
        Computer
    };

    class ConcurrentEntityData
    {
        private OsSetPriority _osSetPriority = OsSetPriority.None;
        private MacSetPriority _macSetPriority = MacSetPriority.None;
        private DomainSetPriority _domainSetPriority = DomainSetPriority.None;
        private IPAddress _ipAddress;

        public object _lock = new object();

        // DON'T USE DIRECTLY, NOT THREAD-SAFE, field is like this for serialization
        public readonly HashSet<string> Services = new HashSet<string>();

        public string? Ip { get; private set; }
        public string? Hostname { get; private set; }
        public string? Domain { get; private set; }
        public string? Mac { get; private set; }
        public string? Os { get; private set; }
        public string? Subnet { get; private set; }
        public EntityType Type { get; private set; }


        public ConcurrentEntityData(string ip)
        {
            Type = EntityType.Computer;
            Ip = ip;
            _ipAddress = IPAddress.Parse(ip);

            var ipParts = ip.Split('.');
            Subnet = $"{ipParts[0]}.{ipParts[1]}.{ipParts[2]}.0/24";
        }

        public void AddService(string service)
        {
            lock (_lock)
            {
                if (!Services.Contains(service))
                {
                    Services.Add(service);
                }
            }
        }

        public List<string> GetServices()
        {
            lock (_lock)
            {
                return Services.ToList();
            }
        }

        public void SetOs(string os, OsSetPriority priority)
        {
            if (os == null)
            {
                return;
            }

            lock (_lock)
            {
                if (priority <= _osSetPriority)
                {
                    _osSetPriority = priority;
                    Os = os;
                }
            }
        }

        public void SetMac(string mac, MacSetPriority macSetPriority)
        {
            if (mac == null)
            {
                return;
            }

            lock (_lock)
            {
                if (macSetPriority <= _macSetPriority)
                {
                    _macSetPriority = macSetPriority;
                    Mac = mac;
                }
            }
        }

        public void SetHostname(string hostname)
        {
            if (hostname == null)
            {
                return;
            }

            lock (_lock)
            {
                Hostname = hostname;
            }
        }

        public void TrySetTypeAndMarkAvailableServices(EntityType type)
        {
            lock (_lock)
            {
                if (type == EntityType.DNS)
                {
                    Services.Add("DNS");
                }

                if (type == EntityType.Gateway)
                {
                    Services.Add("Gateway");
                }

                if (type < Type)
                {
                    Type = type;
                }
            }
        }

        public void SetDomain(string domain, DomainSetPriority domainSetPriority)
        {
            if (domain == null)
            {
                return;
            }

            lock (_lock)
            {
                if (domainSetPriority <= _domainSetPriority)
                {
                    _domainSetPriority = domainSetPriority;
                    Domain = domain;
                }
            }
        }

        // Check if entity IP address is the subnet broadcast address
        public bool IsABroadcastAddress()
        {
            return IPNetwork.Parse(Subnet).Broadcast.Equals(IPAddress.Parse(Ip));
        }
    }

    class ConcurrentInteractionData
    {
        // Use concurrent dictionary as concurrent hashset for atomic check and add
        private readonly ConcurrentDictionary<string, bool> _servicePorts = new ConcurrentDictionary<string, bool>();

        private readonly ConcurrentDictionary<long, long> _bytesPerSecond = new ConcurrentDictionary<long, long>();

        public List<string> ServicePorts
        {
            get
            {
                return _servicePorts.Select(kvp => kvp.Key).ToList();
            }
        }

        public List<long[]> BytesPerSecond
        {
            get
            {
                return _bytesPerSecond.OrderBy(bps => bps.Key).Select(kvp => new long[] { kvp.Key, kvp.Value }).ToList();
            }
        }

        public long FirstPacketTimestamp { get; private set; } = long.MaxValue;
        public long LastPacketTimestamp { get; private set; } = long.MinValue;

        private void AggregateBytesHelper(long timestamp)
        {
            FirstPacketTimestamp = Math.Min(FirstPacketTimestamp, timestamp);
            LastPacketTimestamp = Math.Max(FirstPacketTimestamp, timestamp);
        }

        public void TryAddService(string service)
        {
            if (string.IsNullOrEmpty(service))
            {
                return;
            }

            _servicePorts[service] = true;
        }

        public void AggregateBytes(long timestamp, long bytes)
        {
            _bytesPerSecond.AddOrUpdate(timestamp, bytes, (key, value) => value + bytes);
            AggregateBytesHelper(timestamp);
        }

        public ConcurrentInteractionData(long timestamp, long bytes)
        {
            _bytesPerSecond[timestamp] = bytes;
        }
    }

    class ConcurrentSubnetData
    {
        public enum HostnameSetPriority
        {
            FromDHCP,
            FromOneOfTheMachinesUri,
            None
        }

        private object _lock = new object();
        private HostnameSetPriority _hostnameSetPriority = HostnameSetPriority.None;
        private IPNetwork _network;

        public string? Domain { get; private set; }

        public ConcurrentSubnetData(string subnet)
        {
            _network = IPNetwork.Parse(subnet);
        }

        public bool IsIpInSubnet(string ip)
        {
            return _network.Contains(IPAddress.Parse(ip));
        }

        public void SetDomain(string domain, HostnameSetPriority hostnameSetPriority)
        {
            lock (_lock)
            {
                if (hostnameSetPriority <= _hostnameSetPriority)
                {
                    _hostnameSetPriority = hostnameSetPriority;
                    Domain = domain;
                }
            }
        }
    }

    public class PacketAnalyzer : IAsyncDisposable
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

        private readonly ConcurrentDictionary<string, ConcurrentEntityData> _entities = new ConcurrentDictionary<string, ConcurrentEntityData>();
        private readonly ConcurrentDictionary<(string, string), ConcurrentInteractionData> _interactions = new ConcurrentDictionary<(string, string), ConcurrentInteractionData>();
        private readonly ConcurrentDictionary<string, ConcurrentSubnetData> _subnets = new ConcurrentDictionary<string, ConcurrentSubnetData>();
        private readonly List<Packet> _packets = new List<Packet>();

        private readonly Parser _userAgentParser = Parser.GetDefault();
        private PacketCommunicator? _packetCommunicator;
        private Task? _packetSniffTask;

        // OnSniff - Good for workflows that involve constant polling for analysis
        // Aggregate - Good for workflows that invlove polling for analysis once or very few often
        public enum PacketAnalysisTiming
        {
            OnSniff,
            Aggregate
        }

        // Offline packet capture
        public void Initialize(PacketDevice packetDevice, PacketAnalysisTiming packetAnalysisTiming)
        {
            _packetCommunicator = packetDevice.Open(65536, PacketDeviceOpenAttributes.Promiscuous, 1000);
            _packetSniffTask = Task.Run(() => _packetCommunicator.ReceivePackets(0, packetAnalysisTiming == PacketAnalysisTiming.Aggregate ? AggregatePacketToMemory : AnalyzePacket));
        }

        public async Task<string> GetCytoscapeGraphJson(bool waitForPacketDeviceEof)
        {
            if (waitForPacketDeviceEof)
            {
                // Wait for file read
                await _packetSniffTask;
            }

            // Process in parallel
            await AnalyzeAggregatedPacketsInParallel(ThreadCount);
            await DoFinalDataProcessing(ThreadCount);

            return GenerateCytoscapeGraphJsonFromAnalysis();
        }

        private float SubnetCircleRadiusOnGraph(int subnetEntityCount)
        {
            return (float)Math.Sqrt(subnetEntityCount) * 100f;
        }


        // TODO: move to class
        private string GenerateCytoscapeGraphJsonFromAnalysis()
        {
            // Generate circle coordinates for subnets
            var subnets = _entities.GroupBy(entity => entity.Value.Subnet).ToList();
            float maxSubnetCircleRadius = SubnetCircleRadiusOnGraph(subnets.Select(subnet => subnet.Count()).Max());
            float averageSubnetCircleRadius = SubnetCircleRadiusOnGraph(subnets.Select(subnet => subnet.Count()).Max());
            float viewBoxWidth = (float)Math.Sqrt(averageSubnetCircleRadius * 2f) * 400f;

            Dictionary<string, double[]>? subnetEntityPositions = null;

            int maxTries = 20;
            for (int i = 0; i < maxTries; i++)
            {
                var subnetCircleCenters = UniformPoissonDiskSampler.SampleRectangle(
                new Vector2(0f, 0f),
                new Vector2(viewBoxWidth, viewBoxWidth),
                2 * maxSubnetCircleRadius);


                if (subnetCircleCenters.Count < subnets.Count)
                {
                    viewBoxWidth *= 1.1f;
                    continue;
                }

                int subnetIndex = 0;
                subnetEntityPositions = new Dictionary<string, double[]>();
                subnets.ForEach(subnet =>
                {
                    double subnetRadius = SubnetCircleRadiusOnGraph(subnet.Count());
                    var subnetCenter = subnetCircleCenters[subnetIndex];
                    float radiansBetweenEntities = 2f * (float)Math.PI / subnet.Count();
                    int entityIndex = 0;
                    foreach (var entity in subnet)
                    {
                        double x = subnetCenter.X + subnetRadius * Math.Cos(radiansBetweenEntities * entityIndex) - viewBoxWidth / 2.0;
                        double y = subnetCenter.Y + subnetRadius * Math.Sin(radiansBetweenEntities * entityIndex) - viewBoxWidth / 2.0;
                        var position = new double[] { x, y }; // TODO: round position to reduce JSON size
                        subnetEntityPositions[entity.Key] = position;
                        entityIndex++;
                    }

                    subnetIndex++;
                });
            }

            if (subnetEntityPositions == null)
            {
                Console.WriteLine("Failed to generate positions for entities!!!");
            }

            // Generate graph JSON
            // use .ToList() intensively for concurrency
            var graphClass = new
            {
                Entities = _entities.ToList()
                .Where(kvp => !kvp.Value.IsABroadcastAddress())
                .Select(kvp => new object[] { kvp.Key, kvp.Value }),

                Interactions = _interactions.ToList()
                .Where(interaction => _entities.TryGetValue(interaction.Key.Item1, out ConcurrentEntityData data) && !data.IsABroadcastAddress())
                .Where(interaction => _entities.TryGetValue(interaction.Key.Item2, out ConcurrentEntityData data) && !data.IsABroadcastAddress())
                .Select(interaction => new object[]
                { 
                    new string[] { interaction.Key.Item1, interaction.Key.Item2 },
                    interaction.Value.BytesPerSecond,
                    interaction.Value.FirstPacketTimestamp,
                    interaction.Value.ServicePorts
                }),

                EntityPositions = subnetEntityPositions,
                Subnets = _subnets.ToList().Select(kvp => new object[] { kvp.Key, kvp.Value }),
                CaptureStartTimestamp = _interactions.Any() ? _interactions.ToList().Select(interaction => interaction.Value.FirstPacketTimestamp).Min() : 0,
                CaptureEndTimestamp = _interactions.Any() ? _interactions.ToList().Select(interaction => interaction.Value.LastPacketTimestamp).Max() : 0
            };

            return JsonConvert.SerializeObject(graphClass);
        }

        private void AggregatePacketToMemory(Packet packet)
        {
            // Optimization: schedule for thread to process immediately when
            // N packets are aggregated (N = totalPackets/threadCount + 1)
            _packets.Add(packet);
        }

        private async Task DoFinalDataProcessing(int threadCount)
        {
            var entities = _entities.ToArray();
            var firstPass = DoFinalDataProcessingOnEntityFirstPass;
            var secondPass = DoFinalDataProcessingOnEntitySecondPass;

            var passes = new List<Action<ConcurrentEntityData>> { firstPass, secondPass };
            foreach(var pass in passes)
            {
                await Task.WhenAll(Enumerable.Range(0, threadCount)
                .Select(chunkIndex =>
                {
                    return Task.Run(() =>
                    {
                        int chunkSize = entities.Length / threadCount + 1;
                        int start = chunkIndex * chunkSize;
                        int end = chunkIndex * chunkSize + chunkSize;
                        for (int i = start; i < end; i++)
                        {
                            if (i >= entities.Length)
                            {
                                break;
                            }

                            pass(entities[i].Value);
                        }
                    });
                }));
            }
        }

        private void DoFinalDataProcessingOnEntityFirstPass(ConcurrentEntityData data)
        {
            if (data.GetServices().Any(ServicesThatMakeYouAServer.Contains))
            {
                // Entity provides services that are server-like
                data.TrySetTypeAndMarkAvailableServices(EntityType.Server);
            }

            string hostname = data.Hostname;
            if (hostname != null && hostname.Count(c => c == '.') >= 2)
            {
                if (!hostname.Contains(Uri.SchemeDelimiter))
                {
                    hostname = string.Concat(Uri.UriSchemeHttp, Uri.SchemeDelimiter, hostname);
                }

                if (!string.IsNullOrEmpty(hostname) && Uri.TryCreate(hostname, UriKind.Absolute, out Uri? uri))
                {
                    _subnets.TryAdd(data.Subnet, new ConcurrentSubnetData(data.Subnet));
                    _subnets[data.Subnet].SetDomain(uri.Host, ConcurrentSubnetData.HostnameSetPriority.FromOneOfTheMachinesUri);
                }
            }
        }

        private void DoFinalDataProcessingOnEntitySecondPass(ConcurrentEntityData data)
        {
            ConcurrentSubnetData? subnetThatContainsEntityIp = _subnets.FirstOrDefault(subnet => subnet.Value.IsIpInSubnet(data.Ip)).Value;
            if (subnetThatContainsEntityIp != null && subnetThatContainsEntityIp.Domain != null)
            {
                data.SetDomain(subnetThatContainsEntityIp.Domain, DomainSetPriority.FromSubnet);
            }
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
            try
            {
                // Make sure this is at start to first add source Ip if present
                TryExtractEntity(packet);

                TryExtractInteraction(packet);
                TryExtractDeviceServiceFromPort(packet);
                TryExtractOsFromHttp(packet);
                TryExtractDnsInfo(packet);
                TryExtractDHCPInfo(packet);
                TryExtractARPInfo(packet);
                TryExtractSSDPInfo(packet);
            }
            catch
            {
                // TODO: log
            }
        }

        private string? TryGetSourceIpFromSSDPPayload(string userAgent)
        {
            int httpIndex = userAgent.IndexOf("http://");
            if (httpIndex == -1)
            {
                return null;
            }

            int endpointStringIndex = httpIndex + "http://".Length;
            if (endpointStringIndex >= userAgent.Length)
            {
                return null;
            }

            string endpointUntilEndOfUserAgent = userAgent.Substring(endpointStringIndex);
            var parts = endpointUntilEndOfUserAgent.Split(':');
            if (parts.Length <= 1)
            {
                return null;
            }

            if (!IPAddress.TryParse(parts[0], out IPAddress? endpointIp) || endpointIp.AddressFamily != System.Net.Sockets.AddressFamily.InterNetwork)
            {
                return null;
            }

            return endpointIp.ToString();
        }

        private void TryExtractSSDPInfo(Packet packet)
        {
            // Port 1900 is for SSDP
            if (!packet.IsUdp() || packet.Ethernet.IpV4.Udp.SourcePort != 1900 && packet.Ethernet.IpV4.Udp.DestinationPort != 1900)
            {
                return;
            }


            string payload = Encoding.ASCII.GetString(packet.Ethernet.IpV4.Udp.Payload.Select(b => b).ToArray());
            if (payload == null)
            {
                return;
            }

            string sourceIp;
            if (packet.Ethernet.IpV4.Source.IsMiscIp())
            {
                sourceIp = TryGetSourceIpFromSSDPPayload(payload);
                // Is there a purpose if there's no IP?
                // Is there a purpose to anything?
                if (sourceIp == null)
                {
                    return;
                }
            }
            else
            {
                sourceIp = packet.Ethernet.IpV4.Source.ToString();
            }

            try
            {
                ClientInfo clientInfo = _userAgentParser.Parse(payload);
                if (clientInfo == null)
                {
                    return;
                }

                AssertEntityPresentOrAdd(sourceIp);
                var entityData = _entities[sourceIp];

                if (payload.Contains("windows", StringComparison.OrdinalIgnoreCase))
                {
                    if (clientInfo.OS.ToString().Contains("windows", StringComparison.OrdinalIgnoreCase))
                    {
                        entityData.SetOs(clientInfo.OS.ToString(), OsSetPriority.FromSSDP);
                    }
                    else
                    {
                        entityData.SetOs("Windows", OsSetPriority.FromSSDP);
                    }
                }
                else
                {
                    entityData.SetOs(clientInfo.OS.ToString(), OsSetPriority.FromSSDP);
                }
            }
            catch
            {
            }
        }

        private void AssertEntityPresentOrAdd(string ip)
        {
            _entities.TryAdd(ip, new ConcurrentEntityData(ip));
        }

        private void TryExtractARPInfo(Packet packet)
        {
            if (!(packet?.Ethernet?.IsValid ?? false))
            {
                return;
            }

            if (!(packet.Ethernet.Arp?.IsValid ?? false))
            {
                return;
            }

            if (packet.Ethernet.Arp.HardwareType != PcapDotNet.Packets.Arp.ArpHardwareType.Ethernet)
            {
                return;
            }

            var senderIp = packet.Ethernet.Arp.SenderProtocolIpV4Address.ToString();
            var senderMac = AddressUtils.MacBytesToString(packet.Ethernet.Arp.SenderHardwareAddress);
            if (string.IsNullOrEmpty(senderIp) || string.IsNullOrEmpty(senderMac))
            {
                return;
            }

            AssertEntityPresentOrAdd(senderIp);
            _entities[senderIp].SetMac(senderMac, MacSetPriority.FromARP);
        }

        private void TryExtractDHCPInfo(Packet packet)
        {
            if (!packet.IsUdp())
            {
                return;
            }

            // Return if not DHCP message from DHCP server
            if (packet.Ethernet.IpV4.Udp.SourcePort != 67)
            {
                return;
            }

            var udpBytes = packet.Ethernet.IpV4.Udp.Payload?.ToMemoryStream()?.ToArray();
            if (udpBytes == null)
            {
                return;
            }

            var dhcp = DHCPPacketParser.Parse(udpBytes);
            if (dhcp == null)
            {
                return;
            }

            if (dhcp.op != MessageOpCode.BOOTREPLY)
            {
                return;
            }

            if (!dhcp.options.Any(x => x is DHCPOptionDHCPMessageType type && type.MessageType == DHCPMessageType.DHCPACK))
            {
                return;
            }

            var subnetMaskAddress = ((DHCPOptionSubnetMask)dhcp.options.FirstOrDefault(x => x is DHCPOptionSubnetMask mask))?.SubnetMask;
            if (subnetMaskAddress == null)
            {
                return;
            }

            // Get DHCP server and subnet info
            var dhcpServerIp = ((DHCPOptionDHCPServerIdentifier)dhcp.options.FirstOrDefault(x => x is DHCPOptionDHCPServerIdentifier mask))?.ServerIdentifier;
            if (dhcpServerIp == null)
            {
                return;
            }

            byte[] subnetIpBytes;
            if (dhcp.ciaddr.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork)
            {
                // AND client IP and subnet mask to get subnet address
                subnetIpBytes = dhcp.ciaddr.GetAddressBytes().Zip(subnetMaskAddress.GetAddressBytes(), (first, second) => (byte)(first & second)).ToArray();
            }
            else if (dhcpServerIp != null && dhcpServerIp.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork)
            {
                // AND DHCP server IP and subnet mask to get subnet address
                subnetIpBytes = dhcpServerIp.GetAddressBytes().Zip(subnetMaskAddress.GetAddressBytes(), (first, second) => (byte)(first & second)).ToArray();
            }
            else
            {
                // Couldn't get a reliable ip info from DHCP packet
                return;
            }

            // Add DHCP server info
            string dhcpServerIpStr = dhcpServerIp.ToString();
            AssertEntityPresentOrAdd(dhcpServerIpStr);
            _entities[dhcpServerIpStr].TrySetTypeAndMarkAvailableServices(EntityType.DHCP);


            // Add subnet to gathered subnets
            var subnet = $"{AddressUtils.IpBytesToString(subnetIpBytes)}/{AddressUtils.MaskAddressToMaskNumber(subnetMaskAddress)}";
            var subnetDomain = ((DHCPOptionDomainName)dhcp.options.FirstOrDefault(x => x is DHCPOptionDomainName mask))?.DomainName;
            _subnets.TryAdd(subnet, new ConcurrentSubnetData(subnet));
            if (subnetDomain != null)
            {
                _subnets[subnet].SetDomain(subnetDomain, ConcurrentSubnetData.HostnameSetPriority.FromDHCP);
            }

            // Add routers info`
            ((DHCPOptionRouter)dhcp.options.FirstOrDefault(x => x is DHCPOptionRouter))?.Routers?
                .ForEach(ip =>
                {
                    if (ip.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork)
                    {
                        var routerIp = ip.ToString();
                        AssertEntityPresentOrAdd(routerIp);
                        _entities[routerIp].TrySetTypeAndMarkAvailableServices(EntityType.Gateway);
                    }
                });

            // Add DNS server info
            ((DHCPOptionDomainNameServer)dhcp.options.FirstOrDefault(x => x is DHCPOptionDomainNameServer mask))?.DomainNameServers?.ForEach(dnsServerIp =>
            {
                if (dnsServerIp.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork)
                {
                    string dnsServerIpStr = dnsServerIp.ToString();
                    AssertEntityPresentOrAdd(dnsServerIpStr);
                    _entities[dnsServerIpStr].TrySetTypeAndMarkAvailableServices(EntityType.DNS);
                }
            });


            // Add client info
            var clientIp = dhcp.ciaddr.ToString();
            var clientMac = AddressUtils.MacBytesToString(dhcp.chaddr.GetBytes());
            if (!string.IsNullOrEmpty(clientIp) && !string.IsNullOrEmpty(clientMac))
            {
                AssertEntityPresentOrAdd(clientIp);
                _entities[clientIp].SetMac(clientMac, MacSetPriority.FromDHCP);
            }

            // DO PROCESSING ON DHCP
        }

        private void TryExtractDnsInfo(Packet packet)
        {
            if (!packet.IsUdp())
            {
                return;
            }

            // 53 for DNS, 5353 for mDNS
            if (packet.Ethernet.IpV4.Udp.SourcePort != 53 && packet.Ethernet.IpV4.Udp.SourcePort != 5353)
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

            // Add DNS server info
            if (packet.Ethernet.IpV4.Udp.SourcePort == 53)
            {
                string dnsServerIp = packet.Ethernet.IpV4.Source.ToString();
                AssertEntityPresentOrAdd(dnsServerIp);
                _entities[dnsServerIp].TrySetTypeAndMarkAvailableServices(EntityType.DNS);
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
                AssertEntityPresentOrAdd(ip);
                _entities[ip].SetHostname(hostname);

                if (hostname.StartsWith("DESKTOP-"))
                {
                    _entities[ip].SetOs("Windows", OsSetPriority.FromHostnameDesktopSlash);
                }
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
                AssertEntityPresentOrAdd(sourceIp);
            }

            if (!destinationIp.IsMiscIp())
            {
                AssertEntityPresentOrAdd(destinationIp);
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


            string serviceName = null;
            if (packet.Ethernet.IpV4.Tcp.IsValid)
            {
                if (!TcpPortToServiceName.TryGetValue(packet.Ethernet.IpV4.Tcp.SourcePort, out serviceName))
                {
                    TcpPortToServiceName.TryGetValue(packet.Ethernet.IpV4.Tcp.DestinationPort, out serviceName);
                }
            }
            else if (packet.Ethernet.IpV4.Udp.IsValid)
            {
                if (!UdpPortToServiceName.TryGetValue(packet.Ethernet.IpV4.Udp.SourcePort, out serviceName))
                {
                    UdpPortToServiceName.TryGetValue(packet.Ethernet.IpV4.Udp.DestinationPort, out serviceName);
                }
            }

            // Compare to avoid adding same edge twice
            // Dictionary is used to do atomic [check if present] + [add]
            var interaction = sourceIp.CompareTo(destIp) < 0 ? (sourceIp, destIp) : (destIp, sourceIp);
            ConcurrentInteractionData data = null;
            if (_interactions.TryGetValue(interaction, out data))
            {
                data.AggregateBytes(((DateTimeOffset)packet.Timestamp).ToUnixTimeSeconds(), packet.Count);
            }
            else
            {
                data = new ConcurrentInteractionData(((DateTimeOffset)packet.Timestamp).ToUnixTimeSeconds(), packet.Count);
                _interactions.TryAdd(interaction, data);
            }

            data.TryAddService(serviceName);
        }

        private void TryExtractDeviceServiceFromPort(Packet packet)
        {
            if (!packet.IsTcp() && !packet.IsUdp())
            {
                return;
            }

            // TODO: find better criteria? (some service ports may be above 1023)
            if (packet.Ethernet.IpV4.Tcp.SourcePort > 1023)
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
                    _entities[packet.Ethernet.IpV4.Source.ToString()].AddService(TcpPortToServiceName[port]);
                }
            }
            else
            {
                ushort port = packet.Ethernet.IpV4.Udp.SourcePort;
                if (UdpPortToServiceName.ContainsKey(port))
                {
                    _entities[packet.Ethernet.IpV4.Source.ToString()].AddService(UdpPortToServiceName[port]);
                }
            }
        }

        public async ValueTask DisposeAsync()
        {
            _packetCommunicator?.Break();
            if (_packetSniffTask != null)
            {
                await _packetSniffTask;
            }
        }
    }
}

#pragma warning restore CS8600 // Converting null literal or possible null value to non-nullable type.