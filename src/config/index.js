const randomIpv4 = require('random-ipv4');

// 远端配置
const RemoteConfig = {
    "ppsheep": {
        "type": "ss",
        "server": "127.0.0.1",
        "server_port": 8389,
        "password": "chacha20_password",
        "timeout": 60,
        "method": "chacha20",
    },
    "https-proxy": {
        "type": "https"
    }
}
// 转发规则
const ProxyRule = [
    {
        "url": "",
        "proxy": "ppsheep"
    }
];

module.exports = class Config {

    constructor() {
        this._dnsIpHostCache = {};
        this._dnsHostIpCache = {};
    }

    /**
     * 返回代理请求的remote对象
     */
    getRemote(ip, domain) {

    }

    /**
     * 如果需要代理，则返回198.18段的mock ip.
     * 否则返回真是的ip
     */
    getIp(domain) {
        // 判断域名domain是否需要代理
        // 1. 用户规则制定的域名
        // 2. 用户规则制定的网段
        return this._getMockIp(domain);
        // 3. 查询真实的dns
    }

    /**
     * 根据ip对应的域名
     * @param ip
     */
    getDomain(ip) {
        return this._dnsIpHostCache[ip];
    }

    _getMockIp(domain) {
        while (true) {
            let ip = randomIpv4('198.18.{token}.{token}');
            if (!this._dnsIpHostCache[ip]) {
                this._dnsIpHostCache[ip] = domain;
                this._dnsHostIpCache[domain] = ip;
                return ip;
            }
        }
    }
}
