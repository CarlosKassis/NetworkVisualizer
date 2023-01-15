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

using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace dotnet_reactjs.Utils.Dhcp.Options
{
    public class DHCPOptionClassId : DHCPOption
    {
        public byte[] _classId;
        public byte[] ClassId
        {
            get { return _classId; }
            set
            {
                _classId = new byte[value.Length];
                Array.Copy(value, _classId, value.Length);
            }
        }

        public DHCPOptionClassId(byte [] classId)
        {
            ClassId = classId;
        }

        public DHCPOptionClassId(int optionLength, byte[] buffer, long offset)
        {
            _classId = new byte[optionLength];
            Array.Copy(buffer, offset, _classId, 0, optionLength);
        }

        public override string ToString()
        {
            return "Class Id- " + String.Join(",", (ClassId.Select(x => x.ToString("X2"))));
        }

        public override Task Serialize(Stream stream)
        {
            return SerializeBytes(stream, Enums.DHCPOptionType.ClassId, ClassId);
        }
    }
}
