import { ethers } from "hardhat";

async function main() {
  const Verifier = await ethers.getContractFactory("Verifier");
  const verifier = await Verifier.deploy();

  await verifier.deployed();

  console.log(`RsaSha256Verifier deployed to ${verifier.address}`);

  const ProofOfBaguette = await ethers.getContractFactory("ProofOfBaguette");
  const proofOfBaguette = await ProofOfBaguette.deploy(verifier.address);

  await proofOfBaguette.deployed();

  console.log(`ProofOfBaguette deployed to ${proofOfBaguette.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
