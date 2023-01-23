

namespace NetworkAnalyzer.Core.Analyzers
{
    using PcapDotNet.Core;

    public class OfflinePacketAnalyzer : PacketAnalyzer
    {
        public OfflinePacketAnalyzer(string filePath) 
        {
            OfflinePacketDevice filePacketDevice = new OfflinePacketDevice(filePath);
            Initialize(filePacketDevice, PacketAnalysisTiming.Aggregate);
        }

        public Task<string> GetCytoscapeGraphJson()
        {
            return GetCytoscapeGraphJson(waitForPacketDeviceEof: true);
        }
    }
}
