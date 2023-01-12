

namespace dotnet_reactjs.Core
{
    using Newtonsoft.Json;
    using PcapDotNet.Core;
    using PcapDotNet.Packets;
    using QuikGraph;
    using System.Collections.Concurrent;
    using dotnet_reactjs.Utils;
    using System.Collections.Generic;
    using System.Runtime.CompilerServices;

    class EntityData
    {
        public string Hostname;
    }

    public class PcapAnalyzer
    {
        private const int ThreadCount = 12;

        private readonly ConcurrentDictionary<string, string> _hosts = new ConcurrentDictionary<string, string>();
        private readonly ConcurrentBag<string> _gateways = new ConcurrentBag<string>();
        private readonly ConcurrentDictionary<string, EntityData> _entities = new ConcurrentDictionary<string, EntityData>();
        private readonly ConcurrentBag<(string, string)> _interactions = new ConcurrentBag<(string, string)>();
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
            var edges = _interactions.Distinct().Select(interaction => new UndirectedEdge<string>(interaction.Item1, interaction.Item2)).ToList();

            var networkGraph = new UndirectedGraph<string, UndirectedEdge<string>>();
            networkGraph.AddVerticesAndEdgeRange(edges);

            // Generate graph JSON
            var graphClass = new
            {
                Entities = networkGraph.Vertices.OrderBy(vertex => vertex),
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
            TryExtractEntities(packet);
            TryExtractInteraction(packet);
        }

        private void TryExtractEntities(Packet packet)
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

            // Compare to avoid adding same edge twice
            _interactions.Add(sourceIp.CompareTo(destIp) < 0 ? (sourceIp, destIp) : (destIp, sourceIp));
        }
    }
}
