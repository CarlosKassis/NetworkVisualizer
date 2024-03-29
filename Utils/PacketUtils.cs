﻿using PcapDotNet.Packets;
using PcapDotNet.Packets.IpV4;

namespace NetworkAnalyzer.Utils
{
    public static class PacketUtils
    {
        private static readonly string[] MiscIps = new string[] { "0.0.0.0", "255.255.255.255", "239.255.255.250", "239.250.250.0" };
        public static bool HasIpLayer(this Packet? packet)
        {
            return packet?.Ethernet?.IpV4?.IsValid ?? false;
        }

        public static bool IsUdp(this Packet? packet)
        {
            var ip = packet?.Ethernet?.IpV4;
            if (!(ip?.IsValid ?? false))
            {
                return false;
            }

            return ip.Udp?.IsValid ?? false;
        }

        public static bool IsTcp(this Packet? packet)
        {
            var ip = packet?.Ethernet?.IpV4;
            if (!(ip?.IsValid ?? false))
            {
                return false;
            }

            return ip.Tcp?.IsValid ?? false;
        }

        public static bool IsMiscIp(this string ip)
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
            return address.ToString().IsMiscIp();
        }
    }
}
