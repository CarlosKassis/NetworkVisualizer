using PcapDotNet.Packets;
using PcapDotNet.Packets.IpV4;

namespace dotnet_reactjs.Utils
{
    public static class Packets
    {
        private static readonly string[] MiscIps = new string[] { "0.0.0.0", "255.255.255.255", "239.255.255.250", "239.250.250.0" };
        public static bool HasIpLayer(this Packet? packet)
        {
            return packet?.Ethernet?.IpV4?.IsValid ?? false;
        }

        public static bool IsMiscIp(string ip)
        {
            if (MiscIps.Contains(ip))
            {
                return true;
            }

            if (ip.StartsWith("224.0.0."))
            {
                return true;
            }

            return false;
        }

        public static bool IsMiscIp(this IpV4Address address)
        {
            return IsMiscIp(address.ToString());
        }
    }
}
