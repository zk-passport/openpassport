### zkRSA

[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

This repository's goal is to perform zero knowledge (zk) proofs generation and verification of RSA signatures. All from within a web browser, with local computing resources.

The `circom-rsa-verify` folder contains all necessary circuits and tests for generating zk proofs of valid RSA signatures. It has been cloned from [here](https://github.com/zkp-application/circom-rsa-verify). You should check it out!

The `frontend` folder contains the UI for generating or verifying proofs of valid RSA signatures using circom.

### Generating RSA-SHA256 signatures from the CLI

To generate signatures from the CLI - note that your message does not need to be quoted and can be of arbitrary length -, you can clone this repo and run:

```sh
$ yarn install
$ yarn sign this is a message to sign
```

It will log a new signature, generated out of an randomly generated RSA keypair - uses `node:crypto` -. You can copy those values and use them directly within the [zkRSA UI](https://zkrsa.vercel.app/) for generating a new proof.

### Verifying proofs

On the zkRSA UI, you can generate and verify proofs for valid RSA signatures. The verify tab accepts a JSON with the following format:

```js
{
    "proof": proof,
    "publicSignals": publicSignals
}
```

This is the output format when downloading a proof from the "generate" tab. You can also pre-format your own proof to verify it from the UI.

### Running a frontend locally

To run the UI locally you can clone the repo and run:

```sh
$ cd frontend && yarn install
$ yarn dev
```

There are a few other commands within `frontend/package.json` file, for testing or building the project.

### Links

- [Grant proposal V2](https://hackmd.io/DoZPolTRRN-WNYheT7MauA)
