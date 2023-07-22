//@ts-ignore
import snarkjs from "snarkjs";
import { readFileSync } from "fs";
import {
  unstringifyBigInts,
  //@ts-ignore
} from "snarkjs/src/stringifybigint.js";
import fs from "fs";
import bigInt from "big-integer";

const main = () => {
  // const circuitName = process.argv[2];
  const circuitName = "rsa_verify";
  const { splitToWords, assertWitnessHas } = require("../test/util.js");

  console.log("Loading circuit...");
  const circuitDef = JSON.parse(
    readFileSync(`./bin/${circuitName}.json`, "utf-8")
  );

  console.log("Instantiating circuit...");
  const circuit = new snarkjs.Circuit(circuitDef);

  const exp = bigInt(65537);
  const modulus = bigInt(
    "28159883352674882379057769986480568362451772038776968585004981578225278693333547799102130894763405432587915062082465148496474234575326105385821759136009545779818222153233133035879793115174362760842019209694080335094106992594750768845203453730838752915512153732497843616618793848301960760149638047510008343360196880685663479558178763682016378217247163810196893987406871499561685670874108707284107075831225850508689339986430051452676316285408792544552423732572641619762668633933359140892474838724513811145157680654041371778117922705097996064897405260161239587206924594751637153123036795597697983924175089749292396161441"
  );
  const sign = bigInt(
    "11421002704440838275758104327703219541694143116443588846473971828134487778844684016221045000128421608760663340136706444770533262842224739724790388577861540759248537724228224325826320008026191292927005002194505413540686070846094289808101544462606878681304564711193776960609022832005967163535658828500127030008271205944006367664936507626289241791511913991862417840852461435811537561476559374106251314455102000594960007561777666754199130606872360270853397399211975651186846229644803018232027055655342984015001315397892430118157830024480757997489988388269475398463434333251401882239955420063768498533807664027784037561622"
  );
  const hashed = bigInt(
    "68047946378308475289293787357717828552636626916964367437434418622917273241319"
  );
  const address = bigInt("9D392187c08fc28A86e1354aD63C70897165b982", 16);

  console.log("address", address);
  console.log("address.toString(10)", address.toString(10));

  // my test account: 0x9D392187c08fc28A86e1354aD63C70897165b982
  // hardhat otherAccount: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
  // hardhat owner: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

  const input = Object.assign(
    {},
    splitToWords(sign, 64, 32, "sign"),
    splitToWords(exp, 64, 32, "exp"),
    splitToWords(modulus, 64, 32, "modulus"),
    splitToWords(hashed, 64, 4, "hashed")
    // splitToWords(address, 64, 4, "address")
  );

  input["address"] = address.toString(10);

  console.log("input:", input);
  console.log("Calculating witness...");
  const witness = circuit.calculateWitness(input);

  console.log("witness", witness);

  console.log("Loading vk proof...");
  const vkProof = JSON.parse(
    fs.readFileSync(`./groth16_zkey_prove.json`, "utf8")
  );

  console.log("Loading vk verifier...");
  const vkVerifier = JSON.parse(
    fs.readFileSync(`./groth16_zkey_verify.json`, "utf8")
  );

  console.log("Generating proof...");
  const { proof, publicSignals } = snarkjs.groth.genProof(
    unstringifyBigInts(vkProof),
    unstringifyBigInts(witness)
  );
  console.log("proof:", proof);
  console.log("publicSignals:", publicSignals);

  if (
    snarkjs.groth.isValid(
      unstringifyBigInts(vkVerifier),
      unstringifyBigInts(proof),
      unstringifyBigInts(publicSignals)
    )
  ) {
    console.log("Valid!");
  } else {
    console.log("Invalid!");
  }
  // snarkjs.original.exportSolidityVerifier(
  //   unstringifyBigInts(vkVerifier),
  //   "Verifier"
  // );
};

main();
