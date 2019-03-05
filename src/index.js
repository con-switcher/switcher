const DnsResolver = require('./utils/dns-resolver');
const Config = require('./config/index');
const Dns = require('./dns/index');
const Socks5Server = require('./server/socks5/index');
const SS = require('./remote/ss/index');
const Direct = require('./remote/direct/index');

let dnsResolver = new DnsResolver({});
// 读取配置

let config = new Config({
    dnsResolver,
    remote:{
        ss: SS,
        direct: Direct
    }
});
// 启动dns server
let dnsServer = new Dns({config});
dnsServer.start();

// 启动socks5 server
let socks5Server = new Socks5Server({config});
socks5Server.start();

process.on("SIGINT", function () {
    process.exit();
});
process.on("uncaughtException", function (err) {
    console.error(err);
});
process.on('unhandledRejection', (reason, p) => {
    console.error("Unhandled Rejection at: Promise ", p, " reason: ", reason);
});
