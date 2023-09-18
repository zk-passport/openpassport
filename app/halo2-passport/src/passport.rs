#![allow(unused_imports)]
use ark_std::{end_timer, start_timer};
use num_bigint::{BigInt, BigUint, Sign};
use num_traits::{One, Signed, Zero};
use std::marker::PhantomData;
use std::os::raw::c_int;
use std::time::Instant;

extern crate jni;
use jni::objects::JClass;
use jni::JNIEnv;

use halo2_base::{
    gates::{
        flex_gate::FlexGateConfig,
        range::{RangeConfig, RangeStrategy::Vertical},
        GateInstructions, RangeInstructions,
    },
    halo2_proofs::{
        arithmetic::Field,
        circuit::{Cell, Layouter, SimpleFloorPlanner, Value},
        dev::MockProver,
        halo2curves::bn256::{Bn256, Fr, G1Affine},
        plonk::{
            create_proof, keygen_pk, keygen_vk, verify_proof, Circuit, Column, ConstraintSystem,
            Error, Instance,
        },
        poly::{
            commitment::ParamsProver,
            kzg::{
                commitment::{KZGCommitmentScheme, ParamsKZG},
                multiopen::{ProverSHPLONK, VerifierSHPLONK},
                strategy::SingleStrategy,
            },
        },
        transcript::{
            Blake2bRead, Blake2bWrite, Challenge255, TranscriptReadBuffer, TranscriptWriterBuffer,
        },
    },
    utils::{bigint_to_fe, biguint_to_fe, fe_to_biguint, modulus, PrimeField},
    AssignedValue, Context, QuantumCell, SKIP_FIRST_PASS,
};
use halo2_dynamic_sha256::Sha256DynamicConfig;

use rsa::{Hash, PaddingScheme, PublicKey, PublicKeyParts, RsaPrivateKey, RsaPublicKey};
use sha2::{Digest, Sha256};

use halo2_rsa::{
    decompose_biguint, BigUintConfig, BigUintInstructions, RSAConfig, RSAInstructions, RSAPubE,
    RSAPublicKey, RSASignature, RSASignatureVerifier,
};

use rand::{rngs::OsRng, thread_rng, Rng};

#[derive(Debug, Clone)]
pub struct PassportConfig<F: PrimeField> {
    rsa_config: RSAConfig<F>,
    sha256_config: Sha256DynamicConfig<F>,
    n_instance: Column<Instance>,
    hash_instance: Column<Instance>,
}

pub struct PassportCircuit<F: PrimeField> {
    private_key: RsaPrivateKey,
    public_key: RsaPublicKey,
    msg: Vec<u8>,
    _f: PhantomData<F>,
}

pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

#[no_mangle]
pub extern "C" fn Java_io_tradle_nfc_RNPassportReaderModule_callRustCode(
    _: JNIEnv,
    _: JClass,
) -> c_int {
    // Your Rust code logic here
    4
}

impl<F: PrimeField> PassportCircuit<F> {
    const BITS_LEN: usize = 2048;
    const MSG_LEN: usize = 2048;
    const EXP_LIMB_BITS: usize = 5;
    const DEFAULT_E: u128 = 65537;
    const NUM_ADVICE: usize = 100;
    const NUM_FIXED: usize = 1;
    const NUM_LOOKUP_ADVICE: usize = 16;
    const LOOKUP_BITS: usize = 12;
    const SHA256_LOOKUP_BITS: usize = 8;
    const SHA256_LOOKUP_ADVICE: usize = 8;
    const CIRCUIT_DEGREE: usize = 15;
}

impl<F: PrimeField> Circuit<F> for PassportCircuit<F> {
    type Config = PassportConfig<F>;
    type FloorPlanner = SimpleFloorPlanner;

    fn without_witnesses(&self) -> Self {
        unimplemented!();
    }

    fn configure(meta: &mut ConstraintSystem<F>) -> Self::Config {
        let range_config = RangeConfig::configure(
            meta,
            Vertical,
            &[Self::NUM_ADVICE],
            &[Self::NUM_LOOKUP_ADVICE],
            Self::NUM_FIXED,
            Self::LOOKUP_BITS,
            0,
            Self::CIRCUIT_DEGREE,
        );
        let bigint_config = BigUintConfig::construct(range_config.clone(), 64);
        let rsa_config = RSAConfig::construct(bigint_config, Self::BITS_LEN, Self::EXP_LIMB_BITS);
        let sha256_config = Sha256DynamicConfig::configure(
            meta,
            vec![Self::MSG_LEN],
            range_config,
            Self::SHA256_LOOKUP_BITS,
            Self::SHA256_LOOKUP_ADVICE,
            true,
        );
        let n_instance = meta.instance_column();
        let hash_instance = meta.instance_column();
        meta.enable_equality(n_instance);
        meta.enable_equality(hash_instance);
        Self::Config {
            rsa_config,
            sha256_config,
            n_instance,
            hash_instance,
        }
    }

    fn synthesize(
        &self,
        config: Self::Config,
        mut layouter: impl Layouter<F>,
    ) -> Result<(), Error> {
        let biguint_config = config.rsa_config.biguint_config();
        config.sha256_config.load(&mut layouter)?;
        biguint_config.range().load_lookup_table(&mut layouter)?;
        let mut first_pass = SKIP_FIRST_PASS;
        let (public_key_cells, hashed_msg_cells) = layouter.assign_region(
            || "random rsa modpow test with 2048 bits public keys",
            |region| {
                if first_pass {
                    first_pass = false;
                    return Ok((vec![], vec![]));
                }

                let mut aux = biguint_config.new_context(region);
                let ctx = &mut aux;
                let hashed_msg = Sha256::digest(&self.msg);
                let padding = PaddingScheme::PKCS1v15Sign {
                    hash: Some(Hash::SHA2_256),
                };
                let mut sign = self
                    .private_key
                    .sign(padding, &hashed_msg)
                    .expect("fail to sign a hashed message.");
                sign.reverse();
                let sign_big = BigUint::from_bytes_le(&sign);
                let sign = config
                    .rsa_config
                    .assign_signature(ctx, RSASignature::new(Value::known(sign_big)))?;
                let n_big =
                    BigUint::from_radix_le(&self.public_key.n().clone().to_radix_le(16), 16)
                        .unwrap();
                let e_fix = RSAPubE::Fix(BigUint::from(Self::DEFAULT_E));
                let public_key = config
                    .rsa_config
                    .assign_public_key(ctx, RSAPublicKey::new(Value::known(n_big), e_fix))?;
                let mut verifier = RSASignatureVerifier::new(
                    config.rsa_config.clone(),
                    config.sha256_config.clone(),
                );
                let (is_valid, hashed_msg) =
                    verifier.verify_pkcs1v15_signature(ctx, &public_key, &self.msg, &sign)?;
                biguint_config
                    .gate()
                    .assert_is_const(ctx, &is_valid, F::one());
                biguint_config.range().finalize(ctx);
                {
                    println!("total advice cells: {}", ctx.total_advice);
                    let const_rows = ctx.total_fixed + 1;
                    println!("maximum rows used by a fixed column: {const_rows}");
                    println!("lookup cells used: {}", ctx.cells_to_lookup.len());
                }
                let public_key_cells = public_key
                    .n
                    .limbs()
                    .into_iter()
                    .map(|v| v.cell())
                    .collect::<Vec<Cell>>();
                let hashed_msg_cells = hashed_msg
                    .into_iter()
                    .map(|v| v.cell())
                    .collect::<Vec<Cell>>();
                Ok((public_key_cells, hashed_msg_cells))
            },
        )?;
        for (i, cell) in public_key_cells.into_iter().enumerate() {
            layouter.constrain_instance(cell, config.n_instance, i)?;
        }
        for (i, cell) in hashed_msg_cells.into_iter().enumerate() {
            layouter.constrain_instance(cell, config.hash_instance, i)?;
        }
        Ok(())
    }
}

#[no_mangle]
pub extern "C" fn Java_io_tradle_nfc_RNPassportReaderModule_proveInRust(
    _: JNIEnv,
    _: JClass,
) -> c_int {
    fn run<F: PrimeField>() -> Result<u128, &'static str> {
        let mut rng = thread_rng();
        let private_key = RsaPrivateKey::new(&mut rng, PassportCircuit::<F>::BITS_LEN)
            .expect("failed to generate a key");
        let public_key = RsaPublicKey::from(&private_key);
        let n = BigUint::from_radix_le(&public_key.n().to_radix_le(16), 16).unwrap();
        let mut msg: [u8; 128] = [0; 128];
        for i in 0..128 {
            msg[i] = rng.gen();
        }
        let hashed_msg = Sha256::digest(&msg);

        let circuit = PassportCircuit::<Fr> {
            private_key,
            public_key,
            msg: msg.to_vec(),
            _f: PhantomData,
        };

        let num_limbs = PassportCircuit::<F>::BITS_LEN / 64;
        let limb_bits = 64;
        let n_fes = decompose_biguint::<Fr>(&n, num_limbs, limb_bits);
        let hash_fes = hashed_msg
            .iter()
            .map(|byte| Fr::from(*byte as u64))
            .collect::<Vec<Fr>>();
        let public_inputs = vec![n_fes, hash_fes];

        let public_inputs_slices: Vec<&[Fr]> =
            public_inputs.iter().map(|inner| inner.as_slice()).collect();
        let intermediate: Vec<&[Fr]> = public_inputs_slices
            .iter()
            .map(|inner| inner.as_ref())
            .collect();
        let public_inputs_nested_slice: &[&[&[Fr]]] = &[intermediate.as_slice()];

        let params = ParamsKZG::<Bn256>::setup(
            PassportCircuit::<F>::CIRCUIT_DEGREE.try_into().unwrap(),
            OsRng,
        );

        println!("Generating Verification Key");
        let vk = keygen_vk(&params, &circuit).unwrap();

        println!("Generating Proving Key from Verification Key");
        let pk = keygen_pk(&params, vk, &circuit).unwrap();

        let start_time = std::time::Instant::now();
        let mut transcript = Blake2bWrite::<_, _, Challenge255<_>>::init(vec![]);
        create_proof::<
            KZGCommitmentScheme<Bn256>,
            ProverSHPLONK<'_, Bn256>,
            Challenge255<G1Affine>,
            _,
            Blake2bWrite<Vec<u8>, G1Affine, Challenge255<_>>,
            _,
        >(
            &params,
            &pk,
            &[circuit],
            &public_inputs_nested_slice,
            OsRng,
            &mut transcript,
        )
        .expect("prover should not fail");
        let proof = transcript.finalize();
        let elapsed_time = start_time.elapsed();
        let elapsed_millis = elapsed_time.as_millis();

        // verify the proof to make sure everything is ok
        let verifier_params = params.verifier_params();
        let strategy = SingleStrategy::new(&params);
        let mut transcript = Blake2bRead::<_, _, Challenge255<_>>::init(&proof[..]);
        let verification_result = verify_proof::<
            KZGCommitmentScheme<Bn256>,
            VerifierSHPLONK<'_, Bn256>,
            Challenge255<G1Affine>,
            Blake2bRead<&[u8], G1Affine, Challenge255<G1Affine>>,
            SingleStrategy<'_, Bn256>,
        >(
            verifier_params,
            pk.get_vk(),
            strategy,
            &public_inputs_nested_slice,
            &mut transcript,
        );
        Ok(elapsed_millis)
    }
    match run::<Fr>() {
        Ok(elapsed_millis) => elapsed_millis as i32, // Assuming the elapsed time will fit in an i32
        Err(_) => -1, // return -1 or some other error code when there's an error
    }
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn test_valid_signature() {
        fn run<F: PrimeField>() {
            let mut rng = thread_rng();
            let private_key = RsaPrivateKey::new(&mut rng, PassportCircuit::<F>::BITS_LEN)
                .expect("failed to generate a key");
            let public_key = RsaPublicKey::from(&private_key);
            let n = BigUint::from_radix_le(&public_key.n().to_radix_le(16), 16).unwrap();
            let mut msg: [u8; 128] = [0; 128];
            for i in 0..128 {
                msg[i] = rng.gen();
            }
            let hashed_msg = Sha256::digest(&msg);

            let circuit = PassportCircuit::<F> {
                private_key,
                public_key,
                msg: msg.to_vec(),
                _f: PhantomData,
            };

            let num_limbs = 2048 / 64;
            let limb_bits = 64;
            let n_fes = decompose_biguint::<F>(&n, num_limbs, limb_bits);
            let hash_fes = hashed_msg
                .iter()
                .map(|byte| F::from(*byte as u64))
                .collect::<Vec<F>>();
            let public_inputs = vec![n_fes, hash_fes];
            let prover = match MockProver::run(
                PassportCircuit::<F>::CIRCUIT_DEGREE.try_into().unwrap(),
                &circuit,
                public_inputs,
            ) {
                Ok(prover) => prover,
                Err(e) => panic!("{:#?}", e),
            };
            assert!(prover.verify().is_ok());
        }
        run::<Fr>();
    }

    #[test]
    fn test_invalid_signature() {
        fn run<F: PrimeField>() {
            let mut rng = thread_rng();
            let private_key = RsaPrivateKey::new(&mut rng, PassportCircuit::<F>::BITS_LEN)
                .expect("failed to generate a key");
            let public_key = RsaPublicKey::from(&private_key);
            let n = BigUint::from_radix_le(&public_key.n().to_radix_le(16), 16).unwrap();
            let mut msg: [u8; 128] = [0; 128];
            for i in 0..128 {
                msg[i] = rng.gen();
            }
            let hashed_msg = Sha256::digest(&msg);

            let wrong_private_key = RsaPrivateKey::new(&mut rng, PassportCircuit::<F>::BITS_LEN)
                .expect("failed to generate a key");

            let circuit = PassportCircuit::<F> {
                private_key: wrong_private_key,
                public_key,
                msg: msg.to_vec(),
                _f: PhantomData,
            };

            let num_limbs = 2048 / 64;
            let limb_bits = 64;
            let n_fes = decompose_biguint::<F>(&n, num_limbs, limb_bits);
            let hash_fes = hashed_msg
                .iter()
                .map(|byte| F::from(*byte as u64))
                .collect::<Vec<F>>();
            let public_inputs = vec![n_fes, hash_fes];
            let prover = match MockProver::run(
                PassportCircuit::<F>::CIRCUIT_DEGREE.try_into().unwrap(),
                &circuit,
                public_inputs,
            ) {
                Ok(prover) => prover,
                Err(e) => panic!("{:#?}", e),
            };
            assert!(prover.verify().is_err());
        }
        run::<Fr>();
    }

    #[test]
    fn test_complete_proof() {
        fn run<F: PrimeField>() {
            let start_time = Instant::now();

            let mut rng = thread_rng();
            let private_key = RsaPrivateKey::new(&mut rng, PassportCircuit::<F>::BITS_LEN)
                .expect("failed to generate a key");
            let public_key = RsaPublicKey::from(&private_key);
            let n = BigUint::from_radix_le(&public_key.n().to_radix_le(16), 16).unwrap();
            let mut msg: [u8; 128] = [0; 128];
            for i in 0..128 {
                msg[i] = rng.gen();
            }
            let hashed_msg = Sha256::digest(&msg);

            let circuit = PassportCircuit::<Fr> {
                private_key,
                public_key,
                msg: msg.to_vec(),
                _f: PhantomData,
            };

            let num_limbs = PassportCircuit::<F>::BITS_LEN / 64;
            let limb_bits = 64;
            let n_fes = decompose_biguint::<Fr>(&n, num_limbs, limb_bits);
            let hash_fes = hashed_msg
                .iter()
                .map(|byte| Fr::from(*byte as u64))
                .collect::<Vec<Fr>>();
            let public_inputs = vec![n_fes, hash_fes];

            let public_inputs_slices: Vec<&[Fr]> =
                public_inputs.iter().map(|inner| inner.as_slice()).collect();
            let intermediate: Vec<&[Fr]> = public_inputs_slices
                .iter()
                .map(|inner| inner.as_ref())
                .collect();
            let public_inputs_nested_slice: &[&[&[Fr]]] = &[intermediate.as_slice()];

            let params = ParamsKZG::<Bn256>::setup(
                PassportCircuit::<F>::CIRCUIT_DEGREE.try_into().unwrap(),
                OsRng,
            );

            println!("Generating Verification Key");
            let vk = keygen_vk(&params, &circuit).unwrap();

            println!("Generating Proving Key from Verification Key");
            let pk = keygen_pk(&params, vk, &circuit).unwrap();

            let pf_time = start_timer!(|| "Creating proof");
            let mut transcript = Blake2bWrite::<_, _, Challenge255<_>>::init(vec![]);
            create_proof::<
                KZGCommitmentScheme<Bn256>,
                ProverSHPLONK<'_, Bn256>,
                Challenge255<G1Affine>,
                _,
                Blake2bWrite<Vec<u8>, G1Affine, Challenge255<_>>,
                _,
            >(
                &params,
                &pk,
                &[circuit],
                &public_inputs_nested_slice,
                OsRng,
                &mut transcript,
            )
            .expect("prover should not fail");
            let proof = transcript.finalize();
            end_timer!(pf_time);

            // verify the proof to make sure everything is ok
            let verifier_params = params.verifier_params();
            let strategy = SingleStrategy::new(&params);
            let mut transcript = Blake2bRead::<_, _, Challenge255<_>>::init(&proof[..]);
            assert!(verify_proof::<
                KZGCommitmentScheme<Bn256>,
                VerifierSHPLONK<'_, Bn256>,
                Challenge255<G1Affine>,
                Blake2bRead<&[u8], G1Affine, Challenge255<G1Affine>>,
                SingleStrategy<'_, Bn256>,
            >(
                verifier_params,
                pk.get_vk(),
                strategy,
                &public_inputs_nested_slice,
                &mut transcript
            )
            .is_ok());
            let elapsed_time = start_time.elapsed();
            println!("Elapsed time: {:?}", elapsed_time);
        }
        run::<Fr>();
    }

    #[test]
    fn test_complete_proof_wrong() {
        fn run<F: PrimeField>() {
            let mut rng = thread_rng();
            let private_key = RsaPrivateKey::new(&mut rng, PassportCircuit::<F>::BITS_LEN)
                .expect("failed to generate a key");
            let public_key = RsaPublicKey::from(&private_key);
            let n = BigUint::from_radix_le(&public_key.n().to_radix_le(16), 16).unwrap();
            let mut msg: [u8; 128] = [0; 128];
            for i in 0..128 {
                msg[i] = rng.gen();
            }
            let hashed_msg = Sha256::digest(&msg);

            let wrong_private_key = RsaPrivateKey::new(&mut rng, PassportCircuit::<F>::BITS_LEN)
                .expect("failed to generate a key");

            let circuit = PassportCircuit::<Fr> {
                private_key: wrong_private_key,
                public_key,
                msg: msg.to_vec(),
                _f: PhantomData,
            };

            let num_limbs = PassportCircuit::<F>::BITS_LEN / 64;
            let limb_bits = 64;
            let n_fes = decompose_biguint::<Fr>(&n, num_limbs, limb_bits);
            let hash_fes = hashed_msg
                .iter()
                .map(|byte| Fr::from(*byte as u64))
                .collect::<Vec<Fr>>();
            let public_inputs = vec![n_fes, hash_fes];

            let public_inputs_slices: Vec<&[Fr]> =
                public_inputs.iter().map(|inner| inner.as_slice()).collect();
            let intermediate: Vec<&[Fr]> = public_inputs_slices
                .iter()
                .map(|inner| inner.as_ref())
                .collect();
            let public_inputs_nested_slice: &[&[&[Fr]]] = &[intermediate.as_slice()];

            let params = ParamsKZG::<Bn256>::setup(
                PassportCircuit::<F>::CIRCUIT_DEGREE.try_into().unwrap(),
                OsRng,
            );

            println!("Generating Verification Key");
            let vk = keygen_vk(&params, &circuit).unwrap();

            println!("Generating Proving Key from Verification Key");
            let pk = keygen_pk(&params, vk, &circuit).unwrap();

            let pf_time = start_timer!(|| "Creating proof");
            let mut transcript = Blake2bWrite::<_, _, Challenge255<_>>::init(vec![]);
            create_proof::<
                KZGCommitmentScheme<Bn256>,
                ProverSHPLONK<'_, Bn256>,
                Challenge255<G1Affine>,
                _,
                Blake2bWrite<Vec<u8>, G1Affine, Challenge255<_>>,
                _,
            >(
                &params,
                &pk,
                &[circuit],
                &public_inputs_nested_slice,
                OsRng,
                &mut transcript,
            )
            .expect("prover should not fail");
            let proof = transcript.finalize();
            end_timer!(pf_time);

            // verify the proof to make sure everything is ok
            let verifier_params = params.verifier_params();
            let strategy = SingleStrategy::new(&params);
            let mut transcript = Blake2bRead::<_, _, Challenge255<_>>::init(&proof[..]);
            assert!(verify_proof::<
                KZGCommitmentScheme<Bn256>,
                VerifierSHPLONK<'_, Bn256>,
                Challenge255<G1Affine>,
                Blake2bRead<&[u8], G1Affine, Challenge255<G1Affine>>,
                SingleStrategy<'_, Bn256>,
            >(
                verifier_params,
                pk.get_vk(),
                strategy,
                &public_inputs_nested_slice,
                &mut transcript
            )
            .is_err());
        }
        run::<Fr>();
    }
}
