import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
require("dotenv").config();

const config: HardhatUserConfig = {
  solidity: "0.8.9",
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: process.env.HARDHAT_CHAIN_ID
        ? Number(process.env.HARDHAT_CHAIN_ID)
        : 31337,
    },
    goerli: {
      url: "https://eth-goerli.public.blastapi.io",
      accounts: [process.env.PKEY as string],
    },
    polygon: {
      url: "https://polygon.llamarpc.com",
      accounts: [process.env.PKEY as string],
    },
    gnosis: {
      url: "https://rpc.chiado.gnosis.gateway.fm",
      accounts: [process.env.PKEY as string],
    },
    linea: {
      url: `https://linea-goerli.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: [process.env.PKEY as string],
    },
    mantle: {
      url: "https://rpc.testnet.mantle.xyz",
      accounts: [process.env.PKEY as string],
    },
    neon: {
      url: "https://devnet.neonevm.org",
      accounts: [process.env.PKEY as string],
    },
    celo: {
      url: "https://alfajores-forno.celo-testnet.org",
      accounts: [process.env.PKEY as string],
    },
  },
};

export default config;
