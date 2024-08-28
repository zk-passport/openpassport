import { assert, expect } from 'chai';
import { describe, it } from 'mocha';
import { groth16 } from 'snarkjs';
import { generateCircuitInputsProve } from '../../common/src/utils/generateInputs';
import { OpenPassport1StepVerifier, OpenPassport1StepInputs } from '../src/OpenPassport1Step';
import { genMockPassportData } from '../../common/src/utils/genMockPassportData';
describe('\x1b[95mOpenPassport1Step\x1b[0m', function () {
  this.timeout(0);

  it('OpenPassport1Step - rsa sha256', async function () {
    const path_prove_wasm = '../circuits/build/fromAWS/prove_rsa_65537_sha256.wasm';
    const path_prove_zkey = '../circuits/build/fromAWS/prove_rsa_65537_sha256.zkey';
    const passportData = genMockPassportData('rsa_sha256', 'FRA', '000101', '300101');
    const bitmap = Array(90).fill('1');
    const scope = BigInt(1).toString();
    const majority = '18';
    const user_identifier = '0xE6E4b6a802F2e0aeE5676f6010e0AF5C9CDd0a50';
    const n_dsc = 64;
    const k_dsc = 32;
    const inputs = generateCircuitInputsProve(
      passportData,
      n_dsc,
      k_dsc,
      scope,
      bitmap,
      majority,
      user_identifier
    );
    const { proof, publicSignals } = await groth16.fullProve(
      inputs,
      path_prove_wasm,
      path_prove_zkey
    );
    const openPassport1StepVerifier = new OpenPassport1StepVerifier({
      scope: scope,
      requirements: [
        ['older_than', '18'],
        ['nationality', 'France'],
      ],
      dev_mode: true,
    });
    const openPassportProverInputs = new OpenPassport1StepInputs({
      dscProof: {
        publicSignals: publicSignals,
        proof: proof as any,
      },
      dsc: passportData.dsc as string,
      circuit: 'prove',
    });
    const result = await openPassport1StepVerifier.verify(openPassportProverInputs);
    console.log(result);
    expect(result.valid).to.be.true;
  });

  it('OpenPassport1Step - rsa sha1', async function () {
    const path_prove_wasm = '../circuits/build/fromAWS/prove_rsa_65537_sha1.wasm';
    const path_prove_zkey = '../circuits/build/fromAWS/prove_rsa_65537_sha1.zkey';
    const passportData = genMockPassportData('rsa_sha1', 'FRA', '000101', '300101');
    const bitmap = Array(90).fill('1');
    const scope = BigInt(1).toString();
    const majority = '18';
    const user_identifier = '0xE6E4b6a802F2e0aeE5676f6010e0AF5C9CDd0a50';
    const n_dsc = 64;
    const k_dsc = 32;
    const inputs = generateCircuitInputsProve(
      passportData,
      n_dsc,
      k_dsc,
      scope,
      bitmap,
      majority,
      user_identifier
    );
    const { proof, publicSignals } = await groth16.fullProve(
      inputs,
      path_prove_wasm,
      path_prove_zkey
    );
    const openPassport1StepVerifier = new OpenPassport1StepVerifier({
      scope: scope,
      requirements: [
        ['older_than', '18'],
        ['nationality', 'France'],
      ],
      dev_mode: true,
    });
    const openPassportProverInputs = new OpenPassport1StepInputs({
      dscProof: {
        publicSignals: publicSignals,
        proof: proof as any,
      },
      dsc: passportData.dsc as string,
      circuit: 'prove',
    });
    const result = await openPassport1StepVerifier.verify(openPassportProverInputs);
    console.log(result);
    expect(result.valid).to.be.true;
  });

  it('OpenPassport1Step - rsapss sha256', async function () {
    const path_prove_wasm = '../circuits/build/fromAWS/prove_rsapss_65537_sha256.wasm';
    const path_prove_zkey = '../circuits/build/fromAWS/prove_rsapss_65537_sha256.zkey';
    const passportData = genMockPassportData('rsapss_sha256', 'FRA', '000101', '300101');
    const bitmap = Array(90).fill('1');
    const scope = BigInt(1).toString();
    const majority = '18';
    const user_identifier = '0xE6E4b6a802F2e0aeE5676f6010e0AF5C9CDd0a50';
    const n_dsc = 64;
    const k_dsc = 32;
    const inputs = generateCircuitInputsProve(
      passportData,
      n_dsc,
      k_dsc,
      scope,
      bitmap,
      majority,
      user_identifier
    );
    const { proof, publicSignals } = await groth16.fullProve(
      inputs,
      path_prove_wasm,
      path_prove_zkey
    );
    const openPassport1StepVerifier = new OpenPassport1StepVerifier({
      scope: scope,
      requirements: [
        ['older_than', '18'],
        ['nationality', 'France'],
      ],
      dev_mode: true,
    });
    const openPassportProverInputs = new OpenPassport1StepInputs({
      dscProof: {
        publicSignals: publicSignals,
        proof: proof as any,
      },
      dsc: passportData.dsc as string,
      circuit: 'prove',
    });
    const result = await openPassport1StepVerifier.verify(openPassportProverInputs);
    console.log(result);
    expect(result.valid).to.be.true;
  });
});