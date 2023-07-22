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
  const circuitName = process.argv[2];
  const { splitToWords, assertWitnessHas } = require("../test/util.js");

  console.log("Loading circuit..");
  const circuitDef = JSON.parse(
    readFileSync(`./bin/${circuitName}.json`, "utf-8")
  );

  console.log("Instantiating circuit...");
  const circuit = new snarkjs.Circuit(circuitDef);

  const exp = bigInt(65537);
  const modulus = bigInt(
    "20506905762542020524871161678960952669227058659927078218271030534582761906102467699393948948114139735259706562420121819112616469954212206452989673612962456485305857618836705565920733028260432760902031313787720369995510471130599102558482336196876350284746643805203867606604791810979044849617116414687907664642425838288031468042894615870085669599118270574276888256966317882601643671908532332881082928485931800682216974215333508696744511589005313614483528061110932069902761669230087546367823235305619310530467515083259158991386499753659530202286867052240182476186344672076897333556704707979558010033445565709135805374613"
  );
  const sign = bigInt(
    "5332533708304928746894390686611370107777648928992425061277200333880115157436051084444362905461532996433641113519926367874526095072310720152973308224330358686438617471416055294190586134682872348440672370380995250031085161121381564017697263551778610884714382166968969177242355479964292743453957133034752559140338547652996896360540859090172918998428671903288379676931780276952537766132923383266753722220952517425873806713403712573540875001657636820437023260187176397640658050733586006363551613755012222660224916177460794428681462357514747077850858497964541008009093527747458335492854300840516233890468664145778772049050"
  );
  const hashed = bigInt("1391999260142290886374207300432027233340359984115");

  const input = Object.assign(
    {},
    splitToWords(sign, 32, 64, "sign"),
    splitToWords(exp, 32, 64, "exp"),
    splitToWords(modulus, 32, 64, "modulus"),
    splitToWords(hashed, 32, 5, "hashed")
  );

  console.log("Calculating witness..");
  const witness = circuit.calculateWitness(input);

  console.log("Loading vk proof..");
  const vkProof = JSON.parse(
    fs.readFileSync(`./vkeys/${circuitName}.vk_proof`, "utf8")
  );

  console.log("Loading vk verifier");
  const vkVerifier = JSON.parse(
    fs.readFileSync(`./vkeys/${circuitName}.vk_verifier`, "utf8")
  );

  console.log("Generating proof..");
  const { proof, publicSignals } = snarkjs.original.genProof(
    unstringifyBigInts(vkProof),
    unstringifyBigInts(witness)
  );

  if (
    snarkjs.original.isValid(
      unstringifyBigInts(vkVerifier),
      unstringifyBigInts(proof),
      unstringifyBigInts(publicSignals)
    )
  ) {
    console.log("Valid!");
  } else {
    console.log("Invalid!");
  }
};

main();
