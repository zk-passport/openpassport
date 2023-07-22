/*
    Copyright 2018 0KIMS association.

    This file is part of circom (Zero Knowledge Circuit Compiler).

    circom is a free software: you can redistribute it and/or modify it
    under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    circom is distributed in the hope that it will be useful, but WITHOUT
    ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
    or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public
    License for more details.

    You should have received a copy of the GNU General Public License
    along with circom. If not, see <https://www.gnu.org/licenses/>.
*/

include "constants.circom";
include "t1.circom";
include "t2.circom";
include "../binsum.circom";
include "sigmaplus.circom";

template Sha256compression() {
    signal input inp[512];
    signal output out[256];
    signal a[65][32];
    signal b[65][32];
    signal c[65][32];
    signal d[65][32];
    signal e[65][32];
    signal f[65][32];
    signal g[65][32];
    signal h[65][32];
    signal w[64][32];

    var i;

    component sigmaPlus[48];
    for (i=0; i<48; i++) sigmaPlus[i] = SigmaPlus();

    component ct_k[64];
    for (i=0; i<64; i++) ct_k[i] = K(i);

    component ha0 = H(0);
    component hb0 = H(1);
    component hc0 = H(2);
    component hd0 = H(3);
    component he0 = H(4);
    component hf0 = H(5);
    component hg0 = H(6);
    component hh0 = H(7);

    component t1[64];
    for (i=0; i<64; i++) t1[i] = T1();

    component t2[64];
    for (i=0; i<64; i++) t2[i] = T2();

    component suma[64];
    for (i=0; i<64; i++) suma[i] = BinSum(32, 2);

    component sume[64];
    for (i=0; i<64; i++) sume[i] = BinSum(32, 2);

    component fsum[8];
    for (i=0; i<8; i++) fsum[i] = BinSum(32, 2);

    var k;
    var t;

    for (t=0; t<64; t++) {
        if (t<16) {
            for (k=0; k<32; k++) {
                w[t][k] <== inp[t*32+31-k];
            }
        } else {
            for (k=0; k<32; k++) {
                sigmaPlus[t-16].in2[k] <== w[t-2][k];
                sigmaPlus[t-16].in7[k] <== w[t-7][k];
                sigmaPlus[t-16].in15[k] <== w[t-15][k];
                sigmaPlus[t-16].in16[k] <== w[t-16][k];
                w[t][k] <== sigmaPlus[t-16].out[k];
            }
        }
    }

    for (k=0; k<32; k++ ) {
        a[0][k] <== ha0.out[k]
        b[0][k] <== hb0.out[k]
        c[0][k] <== hc0.out[k]
        d[0][k] <== hd0.out[k]
        e[0][k] <== he0.out[k]
        f[0][k] <== hf0.out[k]
        g[0][k] <== hg0.out[k]
        h[0][k] <== hh0.out[k]
    }

    for (t = 0; t<64; t++) {
        for (k=0; k<32; k++) {
            t1[t].h[k] <== h[t][k];
            t1[t].e[k] <== e[t][k];
            t1[t].f[k] <== f[t][k];
            t1[t].g[k] <== g[t][k];
            t1[t].k[k] <== ct_k[t].out[k];
            t1[t].w[k] <== w[t][k];

            t2[t].a[k] <== a[t][k];
            t2[t].b[k] <== b[t][k];
            t2[t].c[k] <== c[t][k];
        }

        for (k=0; k<32; k++) {
            sume[t].in[0][k] <== d[t][k];
            sume[t].in[1][k] <== t1[t].out[k];

            suma[t].in[0][k] <== t1[t].out[k];
            suma[t].in[1][k] <== t2[t].out[k];
        }

        for (k=0; k<32; k++) {
            h[t+1][k] <== g[t][k];
            g[t+1][k] <== f[t][k];
            f[t+1][k] <== e[t][k];
            e[t+1][k] <== sume[t].out[k];
            d[t+1][k] <== c[t][k];
            c[t+1][k] <== b[t][k];
            b[t+1][k] <== a[t][k];
            a[t+1][k] <== suma[t].out[k];
        }
    }

    for (k=0; k<32; k++) {
        fsum[0].in[0][k] <==  ha0.out[k];
        fsum[0].in[1][k] <==  a[64][k];
        fsum[1].in[0][k] <==  hb0.out[k];
        fsum[1].in[1][k] <==  b[64][k];
        fsum[2].in[0][k] <==  hc0.out[k];
        fsum[2].in[1][k] <==  c[64][k];
        fsum[3].in[0][k] <==  hd0.out[k];
        fsum[3].in[1][k] <==  d[64][k];
        fsum[4].in[0][k] <==  he0.out[k];
        fsum[4].in[1][k] <==  e[64][k];
        fsum[5].in[0][k] <==  hf0.out[k];
        fsum[5].in[1][k] <==  f[64][k];
        fsum[6].in[0][k] <==  hg0.out[k];
        fsum[6].in[1][k] <==  g[64][k];
        fsum[7].in[0][k] <==  hh0.out[k];
        fsum[7].in[1][k] <==  h[64][k];
    }

    for (k=0; k<32; k++) {
        out[31-k]     <== fsum[0].out[k];
        out[32+31-k]  <== fsum[1].out[k];
        out[64+31-k]  <== fsum[2].out[k];
        out[96+31-k]  <== fsum[3].out[k];
        out[128+31-k] <== fsum[4].out[k];
        out[160+31-k] <== fsum[5].out[k];
        out[192+31-k] <== fsum[6].out[k];
        out[224+31-k] <== fsum[7].out[k];
    }
}
