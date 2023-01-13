﻿

namespace dotnet_reactjs.Core
{
    using Newtonsoft.Json;
    using PcapDotNet.Core;
    using PcapDotNet.Packets;
    using QuikGraph;
    using System.Collections.Concurrent;
    using dotnet_reactjs.Utils;
    using System.Collections.Generic;

    class EntityData
    {
        public string? Hostname;
        public readonly HashSet<string> Services = new HashSet<string>();
        public string? Os;
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

        private static readonly Dictionary<string, string> WindowsVersionToName = new Dictionary<string, string>
        {
            { "5.1", "Windows XP" },
            { "5.2", "Windows XP" },
            { "6.0", "Windows Vista" },
            { "6.1", "Windows 7" },
            { "6.2", "Windows 8" },
            { "6.3", "Windows 8.1" },
            { "10.0", "Windows 10" }
        };

        private static readonly Dictionary<ushort, string> UdpPortToServiceName = new Dictionary<ushort, string>()
        {
            { 53, "DNS" },
            { 67, "DHCP" },
            { 264, "BGMP" },
            { 161, "SNMP" }
        };

        private static readonly (int TerminateIndex, char TerminateChar)[] WindowsAfterVersionTerminators = new (int TerminateIndex, char TerminateChar)[] { (3, ')'), (3, ';'), (4, ')'), (4, ';') };
        private static readonly List<string> OsNamesThatCanBeInHttpUserAgent = new List<string> { "Ubuntu", "Linux", "Mac" }; // Putting Linux flavors before "Linux" is important to detect flavor

        private readonly ConcurrentDictionary<string, string> _hosts = new ConcurrentDictionary<string, string>();
        private readonly ConcurrentBag<string> _gateways = new ConcurrentBag<string>();
        private readonly ConcurrentDictionary<string, EntityData> _entities = new ConcurrentDictionary<string, EntityData>();
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
                Edges = networkGraph.Edges.Select(edge => new string[] { edge.Source, edge.Target })
            };

            return JsonConvert.SerializeObject(graphClass);
        }

        private void AggregatePacketToMemory(Packet packet)
        {
            // Optimization: schedule for thread to process immediately when
            // N packets are aggregated (N = totalPackets/threadCount+1)
            _packets.Add(packet);
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
        }

        private void TryExtractOsFromHttp(Packet packet)
        {
            if (!packet.HasIpLayer())
            {
                return;
            }

            if (!(packet?.Ethernet?.IpV4?.Tcp?.Http?.IsValid ?? false))
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

            if (TryGetOsNameFromUserAgent(userAgent, out var osName))
            {
                _entities[packet.Ethernet.IpV4.Source.ToString()].Os = osName;
            }
        }
        private bool TryGetOsNameFromUserAgent(string userAgent, out string? osName)
        {
            if (TryGetWindowsOsNameFromUserAgent(userAgent, out osName))
            {
                return true;
            }

            osName = OsNamesThatCanBeInHttpUserAgent.FirstOrDefault(possibleOsName => userAgent.Contains(possibleOsName));
            return osName != null;
        }

        private bool TryGetWindowsOsNameFromUserAgent(string userAgent, out string? osName)
        {
            osName = null;
            const string windowsIdentifier = "Windows NT ";
            int windowsNTIndex = userAgent.IndexOf(windowsIdentifier);

            if (windowsNTIndex < 0)
            {
                if (userAgent.Contains("Windows"))
                {
                    osName = "Windows";
                }

                return false;
            }

            string versionUntilEnd = userAgent.Substring(windowsNTIndex + windowsIdentifier.Length);
            var pair = WindowsAfterVersionTerminators.FirstOrDefault(pair =>
            {
                if (pair.TerminateIndex >= versionUntilEnd.Length)
                {
                    return false;
                }

                return versionUntilEnd[pair.TerminateIndex] == pair.TerminateChar;
            });

            // Got a default value (no match)
            if (pair.TerminateIndex == 0)
            {
                return false;
            }

            string version = versionUntilEnd.Substring(0, pair.TerminateIndex);
            if (!Version.TryParse(version, out var _))
            {
                return false;
            }

            if (!WindowsVersionToName.TryGetValue(version, out osName))
            {
                throw new Exception($"Couldn't match Windows version string to a Windows name: '{versionUntilEnd}'");
            }

            return true;
        }

        private void TryExtractEntity(Packet packet)
        {
            if (!packet.HasIpLayer())
            {
                return;
            }

            if (!packet.Ethernet.IpV4.Source.IsMiscIp())
            {
                _entities.TryAdd(packet.Ethernet.IpV4.Source.ToString(), new EntityData());
            }

            if (!packet.Ethernet.IpV4.Destination.IsMiscIp())
            {
                _entities.TryAdd(packet.Ethernet.IpV4.Destination.ToString(), new EntityData());
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

            if (Packets.IsMiscIp(sourceIp) || Packets.IsMiscIp(destIp))
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

