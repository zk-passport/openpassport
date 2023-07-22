const RsaVerify = artifacts.require("RsaVerify");

async function doDeploy(deployer) {
  await deployer.deploy(RsaVerify);
}


module.exports = (deployer) => {
  deployer.then(async () => {
      await doDeploy(deployer);
  });
};
