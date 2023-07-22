// const RsaVerify = artifacts.require("RsaVerify");
const Verifier = artifacts.require("Verifier");

async function doDeploy(deployer) {
  // await deployer.deploy(RsaVerify);
  await deployer.deploy(Verifier);
}

module.exports = (deployer) => {
  deployer.then(async () => {
      await doDeploy(deployer);
  });
};

