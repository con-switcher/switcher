const crypto = require("crypto");
const ChaCha20 = require("./crypto/chacha20");
/**
 *  各种方法的key长度 和 iv长度
 */
const method_supported = {
    'chacha20': [32, 8]
};
const OPValues = {
    cipher: 1,
    decipher: 0
};
const bytes_to_key_results = {}; // key 和 iv缓存

// 根据password， key长度、iv长度 生成key 和 iv(不会被使用)
function EVP_BytesToKey(password, key_len, iv_len) {
    let cacheKey = ` ${password}:${key_len}:${iv_len}`;
    if (bytes_to_key_results[cacheKey]) {
        return bytes_to_key_results[cacheKey];
    }
    let md5Array = [];
    let i = 0;
    let count = 0;
    while (count < key_len + iv_len) {
        let md5 = crypto.createHash('md5');
        let data = password;
        if (i > 0) {
            data = Buffer.concat([md5Array[i - 1], password]);
        }
        md5.update(data);
        let d = md5.digest();
        md5Array.push(d);
        count += d.length;
        i += 1;
    }
    let ms = Buffer.concat(md5Array);
    let key = ms.slice(0, key_len);
    let iv = ms.slice(key_len, key_len + iv_len);
    bytes_to_key_results[cacheKey] = {key, iv};
    return {key, iv};
};

function get_cipher(method, op, key, iv) {
    if (method == 'chacha20') {
        return new ChaCha20(key, iv);
    } else {
        if (op === OPValues.cipher) {
            return crypto.createCipheriv(method, key, iv);
        } else {
            return crypto.createDecipheriv(method, key, iv);
        }
    }
}

module.exports = class Cryptor {
    constructor(password, method) {

        this.password = Buffer.from(password, 'binary');
        this.method = method.toLowerCase();

        this.iv_sent = false; // iv是否已经发送给服务器
        this.cipher = null; //
        this.cipher_iv = null;

        this.decipher = null;
        this.decipher_iv = null;

        // 生成key、加密用的iv
        let [keyLen, ivLen] = method_supported[this.method];
        let {key, iv} = EVP_BytesToKey(password, keyLen, ivLen);
        this.key = key;
        this.cipher_iv = iv;
        this.cipher = get_cipher(this.method, OPValues.cipher, key, iv);

    }

    encrypt(buf , id) {
        console.log(id,'buf size', buf.length);
        let result = this.cipher.encrypt(buf);
        console.log(id,'encrypted size', result.length);
        if (this.iv_sent) {
            return result;
        } else {
            this.iv_sent = true;
            let cat = Buffer.concat([this.cipher_iv, result]);
            console.log(id,'merged size', cat.length);
            return cat;
        }
    }

    decrypt(buf) {
        if (this.decipher == null) {
            let [keyLen, ivLen] = method_supported[this.method];
            this.decipher_iv = buf.slice(0, ivLen);
            this.decipher = get_cipher(this.method, OPValues.decipher, this.key, this.decipher_iv);
            return this.decipher.decrypt(buf.slice(ivLen));
        } else {
            return this.decipher.decrypt(buf);
        }
    }

}
