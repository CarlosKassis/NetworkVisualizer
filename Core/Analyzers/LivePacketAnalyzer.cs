using PcapDotNet.Core;

namespace NetworkAnalyzer.Core.Analyzers
{
    public class LivePacketAnalyzer : PacketAnalyzer
    {
        public LivePacketAnalyzer(string nicDesc)
        {
            var avaliableCaptureDevices = LivePacketDevice.AllLocalMachine;
            var nicPacketDevice = avaliableCaptureDevices.First(device => device.Description.Equals(nicDesc));
            Initialize(nicPacketDevice, PacketAnalysisTiming.OnSniff);
        }

        public Task<string> GetCytoscapeGraphJson()
        {
            return GetCytoscapeGraphJson(waitForPacketDeviceEof: false);
        }
    }
}
