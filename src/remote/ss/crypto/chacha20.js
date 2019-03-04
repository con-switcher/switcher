const sodium = require('sodium-native')

module.exports = class Chacha20 {
    constructor(key, iv) {
        this.inst = sodium.crypto_stream_chacha20_xor_instance(iv, key);
    }

    encrypt(data) {
        return this._update(data);
    }

    decrypt(data) {
        return this._update(data);
    }

    _update(data) {
        let result = Buffer.alloc(data.length);
        this.inst.update(result, data);
        return result;
    }
}
