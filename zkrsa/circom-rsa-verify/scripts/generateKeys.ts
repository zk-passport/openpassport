//@ts-ignore
import snarkjs from "snarkjs";
import {
  stringifyBigInts,
  //@ts-ignore
} from "snarkjs/src/stringifybigint.js";
import fs from "fs";
//@ts-ignore
import compiler from "circom";
import path from "path";
import { exit } from "process";

const main = async () => {
  const circuitName = process.argv[2];

  console.log("Compiling circuit..");

  const circuitDef = await compiler(
    path.join(__dirname, "../test/circuits/", `${circuitName}.circom`)
  );

  console.log("Instantiating circuit...");
  const circuit = new snarkjs.Circuit(circuitDef);

  console.log("Starting setup..");
  const setup = snarkjs.original.setup(circuit);

  console.log("Writing vk_proof");
  fs.writeFileSync(
    `./vkeys/${circuitName}.vk_proof`,
    JSON.stringify(stringifyBigInts(setup.vk_proof)),
    "utf8"
  );

  console.log("Writing vk_verifier");

  fs.writeFileSync(
    `./vkeys/${circuitName}.vk_verifier`,
    JSON.stringify(stringifyBigInts(setup.vk_verifier)),
    "utf8"
  );
};

main().then(() => exit(1));
