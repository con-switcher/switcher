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

    constructor({remote, dnsResolver}) {
        this._needProxyIpHostCache = {};

        // ip  是否是 mock的， realIp
        this._hostIpCache = {};
        this._ipRemoteMap = {};

        let ppsheep = new (remote['ss'])({
            config: RemoteConfig.ppsheep, dnsResolver
        });
        let direct = this.direct = new (remote['direct'])({
            config: RemoteConfig.ppsheep, dnsResolver
        });
    }

    /**
     * 返回代理请求的remote对象
     */
    getRemote(ip, domain) {
        // 四种情况
        // 1. dns查询 判断需要走代理的
        // 2. dns查询 判断不需要走代理的
        // 3. 没有经过dns查询，给的域名

        // 4. 其他dns查询，给的ip

        // 简单处理
        // 1. 没有ip的全走代理
        // 2. 有ip mock的走代理
        // 其他直连


        if (this._needProxyIpHostCache[ip]) {// dns查询 判断需要走代理的
            return this._ipRemoteMap[ip];
        }

        if (!ip) {

        }

        return this.direct;
    }

    /**
     * 如果需要代理，则返回198.18段的mock ip.
     * 否则返回真是的ip
     */
    getIp(domain) {
        // 判断域名domain是否需要代理
        // 1. 用户规则制定的域名
        // 2. 用户规则制定的网段
        let ip = this._getMockIp(domain);
        this._hostIpCache[domain] = {
            ip,
            isReal: false,
            realIp: null
        };
        return ip;
        // 3. 查询真实的dns
    }

    /**
     * 根据ip对应的域名
     * @param ip
     */
    getDomain(ip) {
        return this._dnsIpHostCache[ip];
    }

    _getProxyIp(domain) {
        while (true) {
            let ip = randomIpv4('198.18.{token}.{token}');
            if (!this._needProxyIpHostCache[ip]) {
                this._needProxyIpHostCache[ip] = domain;
                return ip;
            }
        }
    }
}
