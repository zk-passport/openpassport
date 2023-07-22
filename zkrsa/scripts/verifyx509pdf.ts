import {
  createVerify,
  createHash,
  X509Certificate,
  publicDecrypt,
} from "crypto";
import fs from "fs";
import { asn1 } from "node-forge";
import * as forge from "node-forge";
import { exit } from "process";
import assert from "assert";
//@ts-ignore
const { extractSignature } = require("node-signpdf");
const bigInt = require("big-integer");

const main = () => {
  const rsa = forge.pki.rsa;

  const pdf = fs.readFileSync("./adhaar.pdf");
  let pem = fs.readFileSync("./cert.pem");

  // extract asn1 signature
  const { ByteRange, signedData, signature } = extractSignature(pdf);
  const x509 = new X509Certificate(pem);
  const signatureASN1 = asn1.fromDer(signature).value as string;
  const pubKey = x509.publicKey.export({ format: "jwk" });

  // ensure signature is of correct format
  const signatureLength = Buffer.from(signatureASN1, "binary").length;
  assert(
    signatureLength == 256,
    `Signature is of incorrect length: ${signatureLength}; should be 256.`
  );

  // verify signature
  const verifyAlgo = createVerify("RSA-SHA1");
  verifyAlgo.update(signedData);
  const result = verifyAlgo.verify(x509.publicKey, signatureASN1, "binary");

  assert(result);

  // manual check - additional example
  const sha1 = createHash("SHA1");
  sha1.update(signedData);
  const digest = sha1.digest();
  const decrypted = publicDecrypt(
    x509.publicKey,
    Buffer.from(signatureASN1, "binary")
  );

  /* 
    signed data is: SHA1_ID || M
    where SHA1_ID is (0x)30 21 30 09 06 05 2b 0e 03 02 1a 05 00 04 14 
    https://www.rfc-editor.org/rfc/rfc8017#section-9.2 (p. 46) 
  */
  assert(Buffer.compare(digest, decrypted.subarray(15, decrypted.length)) == 0);

  // values that can be input to circuit
  console.log({
    derPaddedMsg: BigInt("0x" + decrypted.toString("hex")),
    msg: BigInt("0x" + digest.toString("hex")),
    sig: BigInt("0x" + Buffer.from(signatureASN1, "binary").toString("hex")),
    mod: BigInt(
      "0x" +
        Buffer.from(
          x509.publicKey.export({ format: "jwk" }).n!,
          "base64"
        ).toString("hex")
    ),
  });

  return 0;
};

exit(main());
