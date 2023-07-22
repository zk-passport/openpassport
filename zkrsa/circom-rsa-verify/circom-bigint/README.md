# circom-bigint

This repository contains an implementation of arbitrary-precision natural
numbers for the [`circom`](https://github.com/iden3/circom) language.

## Getting Started

First you'll need a copy of `circomlib` within this repository. You can get it
by running

    git submodule update --init --recursive

Then you'll need to install a local copy of the `circom` compiler and the
testing frameworks

    npm install

Then you can run the tests

    npm test

## The circom compiler

This repository uses a modified version of the circom compiler found at
[alex-ozdemir/circom](https://github.com/alex-ozdemir/circom).
It includes a few extra features not found in the original:

   * Clearer error printouts
   * More comprehensive/informative treatment of `log` statements
   * A new type `int` which enables bigints to be handled during witness
      computations.
   * `compute` blocks
