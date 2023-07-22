# circom-rsa-verify
This repository contains an implementation of a Zero Knowledge Proof for RSA signature verify for the circom language.
Currently supported pkcs1v15 + sha256 and exponent is 65537
# Getting started
Running circuits test cases
```sh
git submodule update --init --recursive; npm install; npm test
```

## Circuits Benchmark
RSA verify: pkcs1v15/sha256/2048 bits key
* Env: Mac mini (M1, 2020). 8 cores. 8 threads   
* Memory consumption: 1.7G   
* Time consumption: 150s   
## The circom compiler

This repository uses a modified version of the circom compiler found at
[alex-ozdemir/circom](https://github.com/alex-ozdemir/circom).
It includes a few extra features not found in the original:

   * Clearer error printouts
   * More comprehensive/informative treatment of `log` statements
   * A new type `int` which enables bigints to be handled during witness
      computations.
   * `compute` blocks
