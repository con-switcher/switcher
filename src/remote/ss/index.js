const net = require('net');
const ip = require('ip');
const Cryptor = require('./cryptor');
// 返回一个连接用来传送字节流
const Socks5HostType = {
    IPv4: 0x01,
    Hostname: 0x03,
    IPv6: 0x04
}
module.exports = class SS {
    constructor({config}) {
        let {serverAddr, serverPort, password, method} = config;
        this.serverAddr = serverAddr;
        this.serverPort = serverPort;
        this.password = password;
        this.method = method;
        this.timeout = 10000;
        this.connections = 0;
    }

    /**
     * 代理连接
     */
    proxySocket({clientSocket, ip, port, domain}) {
        return new Promise((resolve, reject) => {
            let proxy = net.connect(this.serverPort, this.serverAddr);

            let cryptor = new Cryptor(this.password, this.method);

            // 客户流处理
            clientSocket.on("data", function (data) {
                data = cryptor.encrypt(data);
                if (!remote.write(data)) {
                    connection.pause();
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
                return clean();
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
            proxy.once('connect', function () {
                let header = this._getProxyHeader(addr, port, domain);
                let enHeader = cryptor.encrypt(header);
                proxy.write(enHeader);
                clientSocket.resume();
            });
            remote.on("data", function (data) {

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
        })
    }

    _getProxyHeader(serverAddr, serverPort, domain) {
        let buff;
        if (serverAddr) {
            if (net.isIPv4(serverAddr)) {
                buff = Buffer.alloc(5);
                buff.writeUInt8(Socks5HostType.IPv4);
                buff.writeBuffer(ip.toBuffer(serverAddr));
            } else {
                buff = Buffer.alloc(17);
                buff.writeUInt8(Socks5HostType.IPv6);
                buff.writeBuffer(ip.toBuffer(serverAddr));
            }
        } else {
            buff = Buffer.alloc(domain.length + 1);
            buff.writeUInt8(Socks5HostType.Hostname);
            buff.writeUInt8(domain.length);
            buff.writeString(domain);
        }
        buff.writeUInt16BE(serverPort);
        return buff;
    }
};
