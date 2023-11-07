pragma circom 2.1.2;
include "./utils.circom";

// circuits in this folder copied from zk-email, credits to them

// A set of utils for shifting and packing signal arrays
// Performs extraction of reveal signals and packed signals

// From https://github.com/iden3/circomlib/blob/master/circuits/multiplexer.circom
function log2(a) {
    if (a == 0) {
        return 0;
    }
    var n = 1;
    var r = 1;
    while (n<a) {
        r++;
        n *= 2;
    }
    return r;
}

// Pack size is # of chunks i.e. number of char signals that fit into a signal (default 7 but can be 30)
template PackBytes(max_in_signals, max_out_signals, pack_size) {
    assert(max_out_signals == ((max_in_signals - 1) \ pack_size + 1)); // Packing constant is wrong

    signal input in[max_in_signals];
    signal output out[max_out_signals];

    component packer[max_out_signals];
    for (var i = 0; i < max_out_signals; i++) {
        packer[i] = Bytes2Packed(pack_size);
        for (var j = 0; j < pack_size; j++) {
            var reveal_idx = i * pack_size + j;
            if (reveal_idx < max_in_signals) {
                packer[i].in[j] <== in[i * pack_size + j];
            } else {
                packer[i].in[j] <== 0;
            }
        }
        out[i] <== packer[i].out;
    }
}

// Shift the input left by variable size of bytes.
// From https://demo.hedgedoc.org/s/Le0R3xUhB
// Note that if len_bits < max_substr * C, C around 1, then
// it's more efficient to use Sampriti's O(nk) solution instead
template VarShiftLeft(in_array_len, out_array_len) {
    var len_bits = log2(in_array_len);
    assert(in_array_len <= (1 << len_bits));
    signal input in[in_array_len]; // x
    signal input shift; // k

    signal output out[out_array_len]; // y

    component n2b = Num2Bits(len_bits);
    n2b.in <== shift;

    signal tmp[len_bits][in_array_len];
    for (var j = 0; j < len_bits; j++) {
        for (var i = 0; i < in_array_len; i++) {
            var offset = (i + (1 << j)) % in_array_len;
            // Shift left by 2^j indices if bit is 1
            if (j == 0) {
                tmp[j][i] <== n2b.out[j] * (in[offset] - in[i]) + in[i];
            } else {
                tmp[j][i] <== n2b.out[j] * (tmp[j-1][offset] - tmp[j-1][i]) + tmp[j-1][i];
            }
        }
    }

    // Return last row
    // TODO: Assert the rest of the values are 0
    for (var i = 0; i < out_array_len; i++) {
        out[i] <== tmp[len_bits - 1][i];
    }
}

// Shift the input left by variable size of bytes.
// Its input and output are the same as those of VarShiftLeft.
// However, it assumes the input is the masked bytes and checks that shift is the first index of the non-masked bytes.
template VarShiftMaskedStr(in_array_len, out_array_len) {
    signal input in[in_array_len]; // x
    signal input shift; // k
    signal output out[out_array_len] <== VarShiftLeft(in_array_len, out_array_len)(in, shift);

    signal is_target_idx[in_array_len];
    signal prev_byte[in_array_len];
    signal is_this_zero[in_array_len];
    signal is_prev_zero[in_array_len];
    for(var i = 0; i < in_array_len; i++) {
        is_target_idx[i] <== IsEqual()([i, shift]);
        is_this_zero[i] <== IsZero()(in[i]);
        is_target_idx[i] * is_this_zero[i] === 0;
         if(i == 0) {
            is_prev_zero[i] <== 1;
        } else {
            is_prev_zero[i] <== IsZero()(in[i-1]);
        }
        is_target_idx[i] * (1 - is_prev_zero[i]) === 0;
    }
}

// From https://demo.hedgedoc.org/s/Le0R3xUhB -- unused
template ClearSubarrayAfterEndIndex(n, nBits) {
    signal input in[n]; // x
    signal input end; // k

    signal output out[n]; // y

    component lt[n];
    for (var i = 0; i < n; i++) {
        lt[i] = LessThan(nBits);
        lt[i].in[0] <== i;
        lt[i].in[1] <== end;

        // y[i] = (i < k) * x[i]
        out[i] <== lt[i].out * in[i];
    }
}

// Lengths here are in signals, even though the final output array is 1/7 the size of max_substr_len
// TODO: Maybe a better architectural decision to avoid mistakes is to require both values and assert their equality
template ShiftAndPack(in_array_len, max_substr_len, pack_size) {
    var max_substr_len_packed = ((max_substr_len - 1) \ pack_size + 1);

    component shifter = VarShiftLeft(in_array_len, max_substr_len);
    component packer = PackBytes(max_substr_len, max_substr_len_packed, pack_size);

    signal input in[in_array_len];
    signal input shift;
    signal output out[max_substr_len_packed];

    for (var i = 0; i < in_array_len; i++) {
        shifter.in[i] <== in[i];
    }
    shifter.shift <== shift;

    // Note that this technically doesn't constrain the rest øf the bits after the max_substr_len to be 0/unmatched/unrevealed
    // Because of the constraints on signed inputs, it seems this should be OK security wise
    // But still, TODO unconstrained assert to double check they are 0
    for (var i = 0; i < max_substr_len; i++) {
        packer.in[i] <== shifter.out[i];
    }
    for (var i = 0; i < max_substr_len_packed; i++) {
        out[i] <== packer.out[i];
    }
}

// Shift the input left by variable size of bytes and pack the shifted bytes into fields under pack_size.
// Its input and output are the same as those of ShiftAndPack.
// However, it assumes the input is the masked bytes and checks that shift is the first index of the non-masked bytes.
template ShiftAndPackMaskedStr(in_array_len, max_substr_len, pack_size) {
    var max_substr_len_packed = ((max_substr_len - 1) \ pack_size + 1);

    component shifter = VarShiftMaskedStr(in_array_len, max_substr_len);
    component packer = PackBytes(max_substr_len, max_substr_len_packed, pack_size);

    signal input in[in_array_len];
    signal input shift;
    signal output out[max_substr_len_packed];

    for (var i = 0; i < in_array_len; i++) {
        shifter.in[i] <== in[i];
    }
    shifter.shift <== shift;

    for (var i = 0; i < max_substr_len; i++) {
        packer.in[i] <== shifter.out[i];
    }
    for (var i = 0; i < max_substr_len_packed; i++) {
        out[i] <== packer.out[i];
    }
}
