const net = require('net');
const ipUtils = require('ip');
const Cryptor = require('./cryptor');
// 返回一个连接用来传送字节流
const Socks5HostType = {
    IPv4: 0x01,
    Hostname: 0x03,
    IPv6: 0x04
}
module.exports = class SS {
    constructor({config}) {
        let {server, server_port, password, method} = config;
        this.serverAddr = server;
        this.serverPort = server_port;
        this.password = Buffer.from(password);
        this.method = method;
        this.timeout = 10000;
        this.connections = 0;
        this.id = 0;
    }

    /**
     * 代理连接
     */
    proxySocket({clientSocket, ip, port, domain}) {
        return new Promise((resolve, reject) => {
            let id = ++this.id;
            let proxy = net.connect(this.serverPort, this.serverAddr);

            let cryptor = new Cryptor(this.password, this.method);

            // 客户流处理
            clientSocket.on("data", (origin) => {

                let data = cryptor.encrypt(origin, id);
                if (!proxy.write(data)) {
                    clientSocket.pause();
                }
            });
            clientSocket.on("end", function () {
                if (proxy) {
                    return proxy.end();
                }
            });
            clientSocket.on("error", function (e) {
                reject(e);
            });
            clientSocket.on("close", function (had_error) {
                if (had_error) {
                    if (proxy) {
                        proxy.destroy();
                    }
                } else {
                    if (proxy) {
                        proxy.end();
                    }
                }
                //return clean();
            });
            clientSocket.on("drain", function () {
                if (proxy) {
                    return proxy.resume();
                }
            });
            clientSocket.setTimeout(this.timeout, function () {
                if (proxy) {
                    proxy.destroy();
                }
                if (clientSocket) {
                    return clientSocket.destroy();
                }
            });

            clientSocket.pause();
            // 服务器流处理
            proxy.once('connect', () => {
                let header = this._getProxyHeader(ip, port, domain);
                let enHeader = cryptor.encrypt(header);
                proxy.write(enHeader);
                clientSocket.resume();
            });
            proxy.on("data", function (data) {
                data = cryptor.decrypt(data);
                if (!clientSocket.write(data)) {
                    return proxy.pause();
                }
            });
            proxy.on("end", function () {
                if (clientSocket) {
                    return clientSocket.end();
                }
            });
            proxy.on("error", function (e) {
                console.log('error')
                reject(e);
            });
            proxy.on("close", function (had_error) {
                if (had_error) {
                    if (clientSocket) {
                        return clientSocket.destroy();
                    }
                } else {
                    if (clientSocket) {
                        return clientSocket.end();
                    }
                }
            });
            proxy.on("drain", function () {
                if (clientSocket) {
                    return clientSocket.resume();
                }
            });
            proxy.setTimeout(this.timeout, function () {
                if (proxy) {
                    proxy.destroy();
                }
                if (clientSocket) {
                    return clientSocket.destroy();
                }
            });
            proxy.setNoDelay(true);
        })
    }

    _getProxyHeader(ip, port, domain) {
        let buff;
        if (ip) {
            if (net.isIPv4(ip)) {
                buff = Buffer.alloc(7);
                buff.writeUInt8(Socks5HostType.IPv4);
                ipUtils.toBuffer(ip).copy(buff, 1);
            } else {
                buff = Buffer.alloc(19);
                buff.writeUInt8(Socks5HostType.IPv6);
                ipUtils.toBuffer(ip).copy(buff, 1);
            }
        } else {
            buff = Buffer.alloc(domain.length + 4);
            buff.writeUInt8(Socks5HostType.Hostname);
            buff.writeUInt8(domain.length, 1);
            buff.write(domain, 2);
        }
        buff.writeUInt16BE(port, buff.length - 2);
        return buff;
    }
};
