const dgram = require('dgram')
const NDP = require('native-dns-packet');
const DNSUtils = require('./utils');


module.exports = class DnsServer {
    constructor({
                    port = 53, addr,
                    config
                }) {
        this.port = port;
        this.addr = addr;
        this.config = config;
        let server = this.server = dgram.createSocket('udp4');
        server.on('error', error => {
        });
        server.on('listening', () => {
            console.log(`dns starterd ${this.port}`)
        });

        this.server.on('message', async (message, rinfo) => {
            const query = NDP.parse(message);
            let domain = query.question[0].name;

            let respond = buf => {
                this.server.send(buf, 0, buf.length, rinfo.port, rinfo.address)
            };
            let ip = await this.config.getIp(domain);

            let response = new NDP();
            response.header.id = query.header.id;
            response.header.qr = 1;
            response.question = query.question;
            response.answer.push(DNSUtils.A({
                name: domain,
                address: ip,
                ttl: 600,
            }));
            let buff = Buffer.alloc(512);
            NDP.write(buff, response);
            this.server.send(buff, 0, buff.length, rinfo.port, rinfo.address);
        });
    }

    start() {
        if (this.addr) {
            this.server.bind(this.port, this.addr)
        } else {
            this.server.bind(this.port)
        }

    }
};


