﻿/// The MIT License(MIT)
/// 
/// Copyright(c) 2017 Conscia Norway AS
/// 
/// Permission is hereby granted, free of charge, to any person obtaining a copy
/// of this software and associated documentation files (the "Software"), to deal
/// in the Software without restriction, including without limitation the rights
/// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
/// copies of the Software, and to permit persons to whom the Software is
/// furnished to do so, subject to the following conditions:
/// 
/// The above copyright notice and this permission notice shall be included in all
/// copies or substantial portions of the Software.
/// 
/// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
/// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
/// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
/// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
/// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
/// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
/// SOFTWARE.


namespace NetworkAnalyzer.Utils.Dhcp.Enums
{
    public enum DHCPOptionType
    {
        Pad = 0,                    // DHCPOptionPad
        SubnetMask = 1,             // DHCPOptionSubnetMask
        TimeOffset = 2,             // DHCPOptionTimeOffset
        Router = 3,                 // DHCPOptionRouter
        TimeServer = 4,             // DHCPOptionTimeServer
        NameServer = 5,
        DomainServer = 6,           // DHCPOptionDomainNameServer
        LogServer = 7,
        QuotesServer = 8,
        LPRServer = 9,
        ImpressServer = 10,
        RLPServer = 11,
        Hostname = 12,              // DHCPOptionHostname
        BootFileSize = 13,
        MeritDumpFile = 14,
        DomainName = 15,            // DHCPOptionDomainName
        SwapServer = 16,
        RootPath = 17,              // DHCPOptionRootPath
        ExtensionFile = 18,
        ForwardOn = 19,
        SrcRteOn = 20,
        PolicyFilter = 21,
        MaxDGAssembly = 22,
        DefaultIPTTL = 23,
        MTUTimeout = 24,
        MTUPlateau = 25,
        MTUInterface = 26,
        MTUSubnet = 27,
        BroadcastAddress = 28,
        MaskDiscovery = 29,
        MaskSupplier = 30,
        RouterDiscovery = 31,
        RouterRequest = 32,
        StaticRoute = 33,       // TODO? (classful)
        Trailers = 34,
        ARPTimeout = 35,
        Ethernet = 36,
        DefaultTCPTTL = 37,
        KeepaliveTime = 38,
        KeepaliveData = 39,
        NISDomain = 40,
        NISServers = 41,
        NTPServers = 42,        // DHCPOptionNTPServer
        VendorSpecific = 43,    // DHCPOptionVendorSpecificInformation
        NETBIOSNameSrv = 44,    // DHCPOptionNetBIOSOverTCPIPNameServer
        NETBIOSDistSrv = 45,    // TODO
        NETBIOSNodeType = 46,   // TODO
        NETBIOSScope = 47,      // TODO
        XWindowFont = 48,
        XWindowManager = 49,
        AddressRequest = 50,    // DHCPOptionRequestedIPAddress
        AddressTime = 51,       // DHCPOptionIPAddressLeaseTime
        Overload = 52,
        DHCPMsgType = 53,       // DHCPOptionMessageType
        DHCPServerId = 54,      // DHCPOptionDHCPServerIdentifier
        ParameterList = 55,     // DHCPOptionParameterList
        DHCPMessage = 56,       // DHCPOptionDHCPMessage
        DHCPMaxMsgSize = 57,    // DHCPOptionMaximumMessageSize
        RenewalTime = 58,       // DHCPOptionRenewalTime
        RebindingTime = 59,     // DHCPOptionRebindingTime
        ClassId = 60,           // DHCPOptionClassId
        ClientId = 61,          // DHCPOptionClientId
        NetWare = 62,
        NetWare1 = 63,
        NISDomainName = 64,
        NISServerAddr = 65,
        ServerName = 66,        // DHCPOptionTFTPServerName
        BootfileName = 67,      // DHCPOptionTFTPBootfile
        HomeAgentAddrs = 68,
        SMTPServer = 69,
        POP3Server = 70,
        NNTPServer = 71,
        WWWServer = 72,
        FingerServer = 73,
        IRCServer = 74,
        StreetTalkServer = 75,
        STDAServer = 76,
        UserClass = 77,
        DirectoryAgent = 78,
        ServiceScope = 79,
        RapidCommit = 80,
        ClientFQDN = 81,
        RelayAgentInformation = 82,     // DHCPOptionRelayAgentInformation
        iSNS = 83,
        NDSServers = 85,
        NDSTreeName = 86,
        NDSContext = 87,
        BCMCSControllerDomainNamelist = 88,
        BCMCSControllerIPv4addressoption = 89,
        Authentication = 90,
        ClientLastTransactionTimeoption = 91,
        AssociatedIpOption = 92,
        ClientSystem = 93,
        ClientNDI = 94,
        LDAP = 95,
        UUID = 97,
        UserAuth = 98,
        GEOCONF_CIVIC = 99,
        PCode = 100,
        TCode = 101,
        NetinfoAddress = 112,
        NetinfoTag = 113,
        URLN = 114,
        AutoConfig = 116,
        NameServiceSearch = 117,
        SubnetSelectionOption = 118,
        DomainSearch = 119,
        SIPServersDHCPOptionN = 120,
        ClasslessStaticRouteOption = 121,   // DHCPOptionClasslessStaticRoute
        CCCN = 122,
        GeoConfOption = 123,
        VIVendorClass = 124,
        VIVendorSpecificInformation = 125,
        EtherbootSignature = 128,
        DOCSIS = 128,
        Kerneloptions = 129,
        CallServerIPaddress = 129,
        Ethernetinterface = 130,
        RemotestatisticsserverIPaddress = 131,
        IEEE802_1QVLANID = 132,
        IEEE802_1DPriority = 133,
        DiffservCodePoint = 134,
        HTTPProxyforphone = 135,
        //OPTION_PANA_AGENT=136,
        //OPTION_V4_LOST=137,
        //OPTION_CAPWAP_AC_V4=138,
        //OPTION-IPv4Address-MoS=139,
        //OPTION-IPv4_FQDN-MoS=140,
        SIPUAConfigurationServiceDomains = 141,
        //OPTION-IPv4_Address-ANDSF=142,
        Unassigned = 143,
        GeoLoc = 144,
        ForceRenewNonceCapable = 145,
        RDNSSSelection = 146,
        TFTPserveraddress = 150,        // DHCPOptionTFTPServer
        Etherboot = 150,
        GRUBconfigurationpathname = 150,
        StatusCode = 151,
        BaseTime = 152,
        StartTimeOfState = 153,
        QueryStartTime = 154,
        QueryEndTime = 155,
        DHCPState = 156,
        DateSource1 = 157,
        //OPTION_V4_PCP_SERVERVariable=158,
        //OPTION_V4_PORTPARAMS=159,
        DHCPCaptivePortal = 160,
        //OPTION_MUD_URL_V4(TEMPORARY-registered2016-11-17,extensionregistered2017-10-02,expires2018-11-17)=161,
        Etherboot1 = 175,
        IPTelephone = 176,
        Etherboot2 = 177,
        PXELINUXMagic = 208,
        ConfigurationFile = 209,
        PathPrefixNPathPrefixOption = 210,
        RebootTime4 = 211,
        v6RD = 212,
        //OPTION_V4_ACCESS_DOMAINN=213,
        SubnetAllocationOption = 220,
        VirtualSubnetSelectionOption = 221,
        End = 255
    }
}
