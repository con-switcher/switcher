const net = require('net');
const Parser = require('./server.parser');

const NoneAuth = require("./auth/None");
const UserPassword = require("./auth/UserPassword");

const ATYP = require('./constants').ATYP;
const CMD = require('./constants').CMD;
const REP = require('./constants').REP;

// -------------- 常量 --------------
// 没有支持的认证
const BUF_AUTH_NO_ACCEPT = new Buffer([0x05, 0xFF]);

const BUF_REP_INTR_SUCCESS = new Buffer([0x05,
    REP.SUCCESS,
    0x00,
    0x01,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00]);

const BUF_REP_DISALLOW = new Buffer([0x05, REP.DISALLOW]);
// 命令不支持
const BUF_REP_CMDUNSUPP = new Buffer([0x05, REP.CMDUNSUPP]);

/**
 *  forward TCP connection to a new HTTP req/res
 */
module.exports = class Server {
    constructor({
                    port,
                    config,
                }) {
        this.port = port;
        this._connections = 0;
        this.maxConnections = 1000;
        this._authMap = {};

        let self = this;

        // 创建socket
        this._srv = new net.Server(function (socket) {
            if (self._connections >= self.maxConnections) { // 超过最大连接数拒绝连接
                console.error('socks5 服务器连接数超过最大限制，拒绝链接');
                socket.destroy();
                return;
            }
            ++self._connections;
            socket.once('close', function (had_err) {
                --self._connections;
            });
            // 处理请求链接
            self._handleSocks5Connection(socket);
        });

        this._srv.on('error', function (err) {
            console.log('socks5 server error', err);
        });
    }

    /**
     * 处理socket链接
     * @param socket
     * @private
     */
    _handleSocks5Connection(socket) {
        let self = this;
        let parser = new Parser(socket);
        parser.on('error', function (err) {
            console.log(err)
            if (socket.writable)
                socket.end();
        });
        parser.on('methods', function (methods) { // 验证
            let authsMap = self._authMap;
            let auth = null;
            for (let i = 0; i < methods.length; i++) {
                let method = methods[i];
                auth = authsMap[method];
                if (auth && auth.needUserName) break;
            }
            if (auth) {
                auth.server(socket, function (result, user, pass) {
                    if (result === true) {
                        parser.authed = true;
                        parser.username = user;
                        parser.password = pass;
                        parser.start();
                    } else {
                        socket.end();
                    }
                });
                socket.write(new Buffer([0x05, auth.METHOD]));
                socket.resume();
            } else {
                socket.end(BUF_AUTH_NO_ACCEPT);
            }
        });
        parser.on('request', function (reqInfo) { // 请求数据
            if (reqInfo.cmd !== 'connect'){
                return socket.end(BUF_REP_CMDUNSUPP);
            }else{
                socket.write(BUF_REP_INTR_SUCCESS)
            }
            // client socket已经被pause

        });

    }

    useAuth(auth) {
        this._authMap[auth.METHOD] = auth;
        return this;
    }

    async start() {

        this.useAuth(new UserPassword());
        this.useAuth(new NoneAuth());
        this._srv.listen(this.port);

        return this;
    }

    close(cb) {
        this._srv.close(cb);
        return this;
    }
};

function handleProxyError(socket, err) {
    if (socket.writable) {
        var errbuf = new Buffer([0x05, REP.GENFAIL]);
        if (err.code) {
            switch (err.code) {
                case 'ENOENT':
                case 'ENOTFOUND':
                case 'ETIMEDOUT':
                case 'EHOSTUNREACH':
                    errbuf[1] = REP.HOSTUNREACH;
                    break;
                case 'ENETUNREACH':
                    errbuf[1] = REP.NETUNREACH;
                    break;
                case 'ECONNREFUSED':
                    errbuf[1] = REP.CONNREFUSED;
                    break;
            }
        }
        socket.end(errbuf);
    }
}
