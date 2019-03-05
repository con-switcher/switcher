const net = require('net');

module.exports = class Direct {
    constructor({dnsResolver, config}) {
        this.dnsResolver = dnsResolver;
        this.connectionId = 0;
    }

    /**
     * 代理连接
     */
    proxySocket({clientSocket, ip, port, domain}) {
        return new Promise(async (resolve, reject) => {
            if (!ip) {
                ip = await this.dnsResolver.resovleIp(domain);
            }
            let id = ++this.connectionId;
            console.log(`${id}, ${domain}, ${ip}`);
            let proxy = net.connect(port, ip);
            proxy.on('connect', function () {
                if (clientSocket.writable) {
                    clientSocket.pipe(proxy);
                    proxy.pipe(clientSocket);
                } else if (proxy.writable)
                    proxy.end();
            });

            proxy.on('close', (hadError) => {
                if (hadError) {
                    clientSocket.destroy();
                } else {
                    clientSocket.end();
                }
            });
            proxy.on('error', (error) => {
                clientSocket.end();
                console.log(id, 'proxy error ', error)
            });

            proxy.setTimeout(1000, () => {
                proxy.destroy();
                clientSocket.destroy();
            });

            clientSocket.on('close', (hadError) => {
                if (hadError) {
                    proxy.destroy();
                } else {
                    proxy.end();
                }
            });
            clientSocket.on('error', (error) => {
                console.log(id, 'client error ', error)
            });

            clientSocket.setTimeout(1000, () => {
                proxy.destroy();
                clientSocket.destroy();
            });

        })
    }

};
