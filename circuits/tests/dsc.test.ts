import { assert, expect } from 'chai';
import path from 'path';
import { wasm as wasm_tester } from 'circom_tester';
import { generateCircuitInputsDSC } from '../../common/src/utils/csca';
import {
  mock_dsc_sha1_rsa_4096,
  mock_dsc_sha256_rsa_4096,
  mock_dsc_sha256_rsapss_4096,
  mock_csca_sha1_rsa_4096,
  mock_csca_sha256_rsa_4096,
  mock_csca_sha256_rsapss_4096,
  mock_dsc_sha384_brainpoolP256r1,
  mock_dsc_sha256_brainpoolP256r1,
  mock_csca_brainpoolP256r1,
  mock_csca_sha256_brainpoolP256r1,
  mock_dsc_sha256_brainpoolP256r1_256,
  mock_csca_sha256_brainpoolP256r1_256,
  mock_dsc_sha256_brainpoolP224r1,
  mock_csca_sha256_brainpoolP224r1_224,
  mock_dsc_sha256_brainpoolP224r1_224,
} from '../../common/src/constants/mockCertificates';
import { max_cert_bytes } from '../../common/src/constants/constants';
import { getCircuitName } from '../../common/src/utils/certificates/handleCertificate';

const sigAlgs = [
  // { sigAlg: 'rsa', hashFunction: 'sha1', domainParameter: '65537', keyLength: '4096' },
  // { sigAlg: 'rsa', hashFunction: 'sha256', domainParameter: '65537', keyLength: '4096' },
  // { sigAlg: 'rsapss', hashFunction: 'sha256', domainParameter: '65537', keyLength: '4096' },
  
  { sigAlg: 'ecdsa', hashFunction: 'sha256', domainParameter: 'brainpoolP256r1', keyLength: '256' },
  // { sigAlg: 'ecdsa', hashFunction: 'sha256', domainParameter: 'brainpoolP224r1', keyLength: '224' },

];

sigAlgs.forEach(({ sigAlg, hashFunction, domainParameter, keyLength }) => {
  describe(`DSC chain certificate - ${hashFunction.toUpperCase()} ${sigAlg.toUpperCase()} ${domainParameter.toUpperCase()} ${keyLength}`, function () {
    this.timeout(0); // Disable timeout
    let circuit;

    // Mock certificates based on signature algorithm and hash function
    let dscCertPem;
    let cscaCertPem;
    const salt = '0';

    switch (`${sigAlg}_${hashFunction}_${domainParameter}_${keyLength}`) {
      case 'rsa_sha256_65537_4096':
        dscCertPem = mock_dsc_sha256_rsa_4096;
        cscaCertPem = mock_csca_sha256_rsa_4096;
        break;
      case 'rsa_sha1_65537_4096':
        dscCertPem = mock_dsc_sha1_rsa_4096;
        cscaCertPem = mock_csca_sha1_rsa_4096;
        break;
      case 'rsapss_sha256_65537_4096':
        dscCertPem = mock_dsc_sha256_rsapss_4096;
        cscaCertPem = mock_csca_sha256_rsapss_4096;
        break;
      case 'ecdsa_sha256_brainpoolP256r1_256':
        dscCertPem = mock_dsc_sha256_brainpoolP256r1_256;
        cscaCertPem = mock_csca_sha256_brainpoolP256r1_256;
        break;
      case 'ecdsa_sha256_brainpoolP224r1_224':
        dscCertPem = mock_dsc_sha256_brainpoolP224r1_224
        cscaCertPem = mock_csca_sha256_brainpoolP224r1_224;
        break;
      default:
        throw new Error('Unsupported signature algorithm and hash function combination');
    }

    const inputs = generateCircuitInputsDSC(
      BigInt(salt).toString(),
      dscCertPem,
      max_cert_bytes,
      true
    );

    before(async () => {
      circuit = await wasm_tester(
        path.join(
          __dirname,
          `../circuits/dsc/instances/${getCircuitName('dsc', sigAlg, hashFunction, domainParameter, keyLength)}.circom`
        ),
        {
          include: [
            // 'node_modules',
            // './node_modules/@zk-kit/binary-merkle-root.circom/src',
            // './node_modules/circomlib/circuits',
          ],
        }
      );
    });

    it('should compute the correct output', async () => {
      const witness = await circuit.calculateWitness(inputs.inputs, true);
      // const blinded_dsc_commitment = (await circuit.getOutput(witness, ['blinded_dsc_commitment']))
      //   .blinded_dsc_commitment;
      // console.log('\x1b[34m%s\x1b[0m', 'blinded_dsc_commitment: ', blinded_dsc_commitment);
      // const merkle_root = (await circuit.getOutput(witness, ['merkle_root'])).merkle_root;
      // console.log('\x1b[34m%s\x1b[0m', 'merkle_root: ', merkle_root);
      // expect(blinded_dsc_commitment).to.be.not.null;
    });
  });
});
