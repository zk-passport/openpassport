import { describe } from 'mocha'
import chai, { assert, expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { arraysAreEqual, bytesToBigDecimal, formatAndConcatenateDataHashes, formatMrz, hexToDecimal, splitToWords } from '../utils/utils'
import { groth16 } from 'snarkjs'
import { hash, toUnsignedByte } from '../utils/computeEContent'
import { DataHash, PassportData } from '../utils/types'
import { genSampleData } from '../utils/sampleData'
const fs = require('fs');

chai.use(chaiAsPromised)

describe('Circuit tests', function () {
  this.timeout(0)

  let passportData: PassportData;
  let inputs: any;

  this.beforeAll(async () => {
    if (fs.existsSync('inputs/passportData.json')) {
      passportData = require('../inputs/passportData.json');
    } else {
      passportData = (await genSampleData()) as PassportData;
      fs.mkdirSync('inputs');
      fs.writeFileSync('inputs/passportData.json', JSON.stringify(passportData));
    }

    const formattedMrz = formatMrz(passportData.mrz);
    const mrzHash = hash(formatMrz(passportData.mrz));
    const concatenatedDataHashes = formatAndConcatenateDataHashes(
      mrzHash,
      passportData.dataGroupHashes as DataHash[],
    );
    
    const concatenatedDataHashesHashDigest = hash(concatenatedDataHashes);

    // console.log('concatenatedDataHashesHashDigest', concatenatedDataHashesHashDigest)
    // console.log('passportData.eContent.slice(72, 72 + 32)', passportData.eContent.slice(72, 72 + 32))
    assert(
      arraysAreEqual(passportData.eContent.slice(72, 72 + 32), concatenatedDataHashesHashDigest),
      'concatenatedDataHashesHashDigest is at the right place in passportData.eContent'
    )

    const reveal_bitmap = Array.from({ length: 88 }, (_, i) => (i >= 16 && i <= 22) ? '1' : '0');

    inputs = {
      mrz: formattedMrz.map(byte => String(byte)),
      reveal_bitmap: reveal_bitmap.map(byte => String(byte)),
      dataHashes: concatenatedDataHashes.map(toUnsignedByte).map(byte => String(byte)),
      eContentBytes: passportData.eContent.map(toUnsignedByte).map(byte => String(byte)),
      signature: splitToWords(
        BigInt(bytesToBigDecimal(passportData.encryptedDigest)),
        BigInt(64),
        BigInt(32)
      ),
      pubkey: splitToWords(
        BigInt(passportData.modulus),
        BigInt(64),
        BigInt(32)
      ),
    }
    
  })
  
  it('should prove and verify with valid inputs', async function () {
    console.log('inputs', inputs)

    const { proof, publicSignals } = await groth16.fullProve(
      inputs,
      "build/passport_js/passport.wasm",
      "build/passport_final.zkey"
    )

    console.log('proof done');

    const revealChars = publicSignals.slice(0, 88).map((byte: string) => String.fromCharCode(parseInt(byte, 10))).join('');
    console.log('reveal chars', revealChars);

    const vKey = JSON.parse(fs.readFileSync("build/verification_key.json"));
    const verified = await groth16.verify(
      vKey,
      publicSignals,
      proof
    )

    assert(verified == true, 'Should verifiable')

    console.log('proof verified');
  })

  it('should fail to prove with invalid mrz', async function () {
    const invalidInputs = {
      ...inputs,
      mrz: inputs.mrz.map((byte: string) => String((parseInt(byte, 10) + 1) % 256)),
    }

    return expect(groth16.fullProve(
      invalidInputs,
      "build/passport_js/passport.wasm",
      "build/passport_final.zkey"
    )).to.be.rejected;
  })

  it('should fail to prove with invalid eContentBytes', async function () {
    const invalidInputs = {
      ...inputs,
      eContentBytes: inputs.eContentBytes.map((byte: string) => String((parseInt(byte, 10) + 1) % 256)),
    }

    return expect(groth16.fullProve(
      invalidInputs,
      "build/passport_js/passport.wasm",
      "build/passport_final.zkey"
    )).to.be.rejected;
  })
  
  it('should fail to prove with invalid signature', async function () {
    const invalidInputs = {
      ...inputs,
      signature: inputs.signature.map((byte: string) => String((parseInt(byte, 10) + 1) % 256)),
    }

    return expect(groth16.fullProve(
      invalidInputs,
      "build/passport_js/passport.wasm",
      "build/passport_final.zkey"
    )).to.be.rejected;
  })

  it('should support selective disclosure', async function () {
    const attributeToPosition = {
      issuing_state: [2, 4],
      name: [5, 43],
      passport_number: [44, 52],
      nationality: [54, 56],
      date_of_birth: [57, 63],
      gender: [65],
      expiry_date: [66, 72],
    }

    const attributeToReveal = {
      issuing_state: false,
      name: false,
      passport_number: false,
      nationality: true,
      date_of_birth: false,
      gender:false,
      expiry_date: false,
    }

    const bitmap = Array.from({ length: 88 }, (_) => '0');

    for(const attribute in attributeToReveal) {
      if (attributeToReveal[attribute]) {
        const [start, end] = attributeToPosition[attribute];
        for(let i = start; i <= end; i++) {
          bitmap[i] = '1';
        }
      }
    }

    inputs = {
      ...inputs,
      reveal_bitmap: bitmap.map(byte => String(byte)),
    }

    const { proof, publicSignals } = await groth16.fullProve(
      inputs,
      "build/passport_js/passport.wasm",
      "build/passport_final.zkey"
    )

    console.log('proof done');
    const revealChars = publicSignals.slice(0, 88).map((byte: string) => String.fromCharCode(parseInt(byte, 10)))

    console.log('revealChars', revealChars)

    for(let i = 0; i < revealChars.length; i++) {
      if (bitmap[i] == '1') {
        assert(revealChars[i] != '\x00', 'Should reveal');
      } else {
        assert(revealChars[i] == '\x00', 'Should not reveal');
      }
    }

    const reveal: Record<string, string | undefined> = {};

    Object.keys(attributeToPosition).forEach((attribute) => {
      if (attributeToReveal[attribute]) {
        const [start, end] = attributeToPosition[attribute];
        const value = revealChars.slice(start, end + 1).join('');
        reveal[attribute] = value;
      } else {
        reveal[attribute] = undefined;
      }
    });

    console.log('reveal', reveal)

    const vKey = JSON.parse(fs.readFileSync("build/verification_key.json"));
    const verified = await groth16.verify(
      vKey,
      publicSignals,
      proof
    )

    assert(verified == true, 'Should verifiable')

    console.log('proof verified');
  })
})
