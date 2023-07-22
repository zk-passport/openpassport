import * as crypto from "crypto";
import { exit } from "process";
const bigInt = require("big-integer");
const ab2str = require("arraybuffer-to-string");

async function main() {
  const ec = new TextEncoder();
  const message = "hello world";

  const { publicKey, privateKey } = await crypto.webcrypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"]
  );

  const k = await crypto.webcrypto.subtle.exportKey("jwk", publicKey);
  const signature = await crypto.webcrypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    privateKey,
    ec.encode(message)
  );
  const digest = await crypto.webcrypto.subtle.digest(
    "SHA-256",
    ec.encode(message)
  );

  const kBinary = bigInt(Buffer.from(k.n!, "base64").toString("hex"), 16).toString();
  const digestDecimal = bigInt(ab2str(digest, "hex"), 16).toString();
  const signatureDecimal = bigInt(ab2str(signature, "hex"), 16).toString();
  console.log({
    digestDecimal,
    signatureDecimal,
    kBinary,
  });
}

main().then(() => exit(1));
