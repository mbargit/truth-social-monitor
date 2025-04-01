import ctypes
import os
import json
import platform

# Set the name of our shared library
lib_name = 'tlsexpert'

VALID_CLIENT_HELLOS = [
  'Firefox_55',
  'Firefox_56',
  'Firefox_63',
  'Firefox_65',
  'Chrome_58',
  'Chrome_62',
  'Chrome_70',
  'Chrome_72',
  'Chrome_83',
  'IOS_11_1',
  'IOS_12_1',
]

# Figure out shared library extension
uname = platform.uname()
ext = '.dll'
bdir = '../linux'
if uname.system == 'Darwin':
    bdir = '../mac'
    ext = '.dylib'
if uname.system == 'Windows':
    bdir = '../win'
    ext = '.dll'

dir_path = os.path.dirname(os.path.realpath(__file__))
lib = ctypes.cdll.LoadLibrary(os.path.join(dir_path, bdir, lib_name+ext))

go_request = lib.request
go_request.argtypes = [ctypes.c_char_p]
go_request.restype = ctypes.c_char_p

go_download = lib.download
go_download.argtypes = [ctypes.c_char_p]
go_download.restype = ctypes.c_char_p

def request(url, method, cHello, proxy, body, headers, timeout, followRedirects):
  enc = json.dumps({"url":url,"method":method,"cHello":cHello,"proxy":proxy,"body":body,"headers":headers,"timeout":timeout,"followRedirects":followRedirects,"fileName":""})
  value = go_request(ctypes.c_char_p(enc.encode('utf8')))
  if not isinstance(value, bytes):
      value = value.encode('utf-8')
  return json.loads(value.decode())

def download(url, method, cHello, proxy, body, headers, timeout, followRedirects, fileName):
  enc = json.dumps({"url":url,"method":method,"cHello":cHello,"proxy":proxy,"body":body,"headers":headers,"timeout":timeout,"followRedirects":followRedirects,"fileName":fileName})
  value = go_download(ctypes.c_char_p(enc.encode('utf8')))
  if not isinstance(value, bytes):
      value = value.encode('utf-8')
  return json.loads(value.decode())

if __name__ == '__main__':

  url = "https://www.jdsports.co.uk/cart/"

  res = request(url, "POST", "Chrome_83", "", json.dumps({"x": "xxx"}),  {
            'upgrade-insecure-requests': '1',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36',
            'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
            'sec-fetch-site': 'none',
            'sec-fetch-mode': 'navigate',
            'sec-fetch-dest': 'document',
            'accept-language': 'en-US,en;q=0.9',
            'accept-encoding': 'br, gzip, deflate',
            }, 5000, True)
  print(res)
