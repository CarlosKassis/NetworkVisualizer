

using Microsoft.AspNetCore.HttpOverrides;
using System.Net;

namespace NetworkAnalyzer.Utils
{
    public static class AddressUtils
    {
        public static string MacBytesToString(IEnumerable<byte> macBytes)
        {
            return BitConverter.ToString(macBytes.ToArray()).Replace('-', ':');
        }

        public static string IpBytesToString(IEnumerable<byte> ipBytes)
        {
            return string.Join('.', ipBytes.Select(ipByte => ipByte.ToString()));
        }

        [Obsolete]
        public static int MaskAddressToMaskNumber(IPAddress maskAddress)
        {
            if (maskAddress.Address == 0)
            {
                return 0;
            }

            uint ipInteger = (uint)maskAddress.Address;
            for (int maskOffset = 1; maskOffset <= 32; maskOffset++)
            {
                if ((ipInteger >> maskOffset) == 0)
                {
                    return maskOffset;
                }
            }

            Console.Error.WriteLine($"Couldn't find subnet mask number for: {maskAddress}");
            return 24;
        }
    }
}
