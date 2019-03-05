const sodium = require('sodium-native')

let key = Buffer.from("23CCAF077EA6CBD8D2ED30CB19EF1B51ED293B5D9D847FEC3A322AF0BA647C68", "hex");
let nonce = Buffer.from("D411B3EE40A49804", "hex");
let nonce12 = Buffer.concat([nonce, Buffer.from('\0\0\0\0')]);

let plaintext1 = Buffer.from("017AE0BAFB0050", "hex");
let ciphertext1 = Buffer.from("D411B3EE40A49804FAD54C0B4799B3", "hex");

let plaintext2 = Buffer.from("474554202F20485454502F312E310D0A486F73743A207777772E6966656E672E636F6D0D0A557365722D4167656E743A206375726C2F372E35382E300D0A4163636570743A202A2F2A0D0A0D0A", "hex");
let ciphertext2 = Buffer.from("16EA6ECCA571038B92770151FCC6EC8971429705C5466C2660A864A1E693D8AB30F9A0FC107C85863805D7A607BA5F8B4FEC8AF1193176464C941704E66B893DA6C5E9FDE6D87EB8EE5B57CBD5", "hex");


let inst = sodium.crypto_stream_chacha20_xor_instance(nonce, key);
let result1 = Buffer.alloc(plaintext1.length);
inst.update(result1, plaintext1);
console.log(result1.toString('hex'));

let result2 = Buffer.alloc(plaintext2.length);
inst.update(result2, plaintext2);
console.log(result2.toString('hex'));

let inst2 = sodium.crypto_stream_chacha20_xor_instance(nonce, key);

let r1 = Buffer.alloc(1);
inst2.update(r1, Buffer.from('01','hex'));
console.log(r1.toString('hex'));

let r2 = Buffer.alloc(2);
inst2.update(r2, Buffer.from('7Ae0','hex'));
console.log(r2.toString('hex'));

console.log(Buffer.concat([Buffer.from('a'), Buffer.from('b')]).toString('ascii'))

