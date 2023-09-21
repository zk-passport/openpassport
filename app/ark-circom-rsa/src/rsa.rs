use ark_circom::{CircomBuilder, CircomConfig};
use ark_std::rand::thread_rng;
use color_eyre::Result;
use std::os::raw::c_int;

use ark_bn254::Bn254;
use ark_crypto_primitives::snark::SNARK;
use ark_groth16::Groth16;

use std::time::Instant;

type GrothBn = Groth16<Bn254>;

extern crate jni;
use jni::objects::JClass;
use jni::JNIEnv;

#[no_mangle]
pub extern "C" fn Java_io_tradle_nfc_RNPassportReaderModule_callRustCode(
    env: JNIEnv,
    _: JClass,
) -> jni::sys::jstring {
    let current_dir = std::env::current_dir().unwrap();
    let path_str = current_dir.to_str().unwrap();
    let output = env.new_string(path_str).expect("Couldn't create java string!");
    output.into_inner()
}

#[no_mangle]
pub extern "C" fn Java_io_tradle_nfc_RNPassportReaderModule_proveRSAInRust(
    _: JNIEnv,
    _: JClass,
) -> c_int {
    fn run() -> Result<u128, Box<dyn std::error::Error>> {
        println!("log before imports");
        const MAIN_WASM: &'static [u8] = include_bytes!("../rsa/main.wasm");
        const MAIN_R1CS: &'static [u8] = include_bytes!("../rsa/main.r1cs");
        
        let cfg = CircomConfig::<Bn254>::from_bytes(MAIN_WASM, MAIN_R1CS)?;

        let mut builder = CircomBuilder::new(cfg);

        let signature: [u128; 32] = [
            4993543337487904319,  5039260395924778555,
            16044715263198697509, 6517674227143205114,
            9783381675666809188,  7797234981612410535,
            9712659746244703685,  8223984644219552691,
            5746171858797010138,  16352708903743190663,
            11557514992480971638, 13495509591487042457,
            11156826800435483355, 7934676927345641909,
            17671838456179191719, 15427313345670295171,
            3979639931302305273,  10870708508897347751,
            17325747030660864416, 4196229958717243275,
            8295837152932404523,  5206285193355768709,
            16500962385150574058, 45927554409508738,
            11056427006453546685, 3610340837562714815,
            2914954158206709664,  9941999032204203280,
            3682966980231699250,  1089954850805856847,
            12801803660741250853, 6643401487810361365
        ];
        let modulus: [u128; 32] = [
            14637485623069577853, 7482098129440337882,
            9329095990282353414,  13124250581866537330,
            18349306516477384309, 3633589540637627345,
            756443621693602880,   9532268969225926567,
            10797289495421403158, 8716880397646489088,
            16390100705849925925, 4946748147388408397,
            5159237052852568257,  4383482229078465345,
            17440536203309797881, 9244726556354794825,
            13954964489103323762, 12859274108738823253,
            15430872548874177827, 8078236913810864353,
            13311543254088155939, 6627932043456339426,
            10937476704429447948, 4860889415451015006,
            4549761793924050171,  1117773587704762559,
            13984923195668836033, 5179232650854575709,
            16174751231280536837, 9625446134615655537,
            6169436660688221259,  13128400207083283532
        ];
        let base_message: [u128; 32] = [
            3626324085499461436,  15137430623782848370,
            13410089559264023318, 7272337899472972005,
            0,                    0,
            0,                    0,
            0,                    0,
            0,                    0,
            0,                    0,
            0,                    0,
            0,                    0,
            0,                    0,
            0,                    0,
            0,                    0,
            0,                    0,
            0,                    0,
            0,                    0,
            0,                    0
        ];

        for &elem in signature.iter() {
            builder.push_input("signature", elem);
        }
        for &elem in modulus.iter() {
            builder.push_input("modulus", elem);
        }
        for &elem in base_message.iter() {
            builder.push_input("base_message", elem);
        }

        // create an empty instance for setting it up
        let circom = builder.setup();
        
        let mut rng = thread_rng();
        let params = GrothBn::generate_random_parameters_with_reduction(circom, &mut rng)?;
        
        let circom = builder.build()?;
        println!("circuit built");
        
        let inputs = circom.get_public_inputs().unwrap();
        
        let start1 = Instant::now();
        
        let proof = GrothBn::prove(&params, circom, &mut rng)?;
        let duration1 = start1.elapsed();
        println!("proof generated. Took: {:?}", duration1);
        
        let start2 = Instant::now();

        let pvk = GrothBn::process_vk(&params.vk).unwrap();
        
        let verified = GrothBn::verify_with_processed_vk(&pvk, &inputs, &proof)?;
        let duration2 = start2.elapsed();
        println!("proof verified. Took: {:?}", duration2);

        assert!(verified);

        Ok(duration1.as_millis())
    }
    match run() {
        Ok(elapsed_millis) => elapsed_millis as i32, // Assuming the elapsed time will fit in an i32
        Err(_) => -1, // return -1 or some other error code when there's an error
    }
}

