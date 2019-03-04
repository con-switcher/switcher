const Config = require('./config/index');
const Dns = require('./dns/index');
const Socks5Server = require('./server/socks5/index');
// 读取配置

let config = new Config();
// 启动dns server
let dnsServer = new Dns({config});
dnsServer.start();

// 启动socks5 server
let socks5Server = new Socks5Server({config});
socks5Server.start();
