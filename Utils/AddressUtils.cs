

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
            return BitConverter.ToString(ipBytes.ToArray()).Replace('-', '.');
        }
    }
}
