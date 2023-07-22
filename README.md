# Passport SBT - ETHGlobal Paris

This is our submission for the ETHGlobal Paris Hackathon.

The goal is too let users scan the NFC chip in their government-issued passport to prove that
it is valid. If valid, the user can generate a proof that can be verified onchain. We are using
that proof to mint them a Soulbound Token (SBT) they can use to show that they indeed hold
an official passport.

We forked two repositories and added functionality to make everything work.

- [passport-reader](https://github.com/tananaev/passport-reader/tree/master): Android app to scan passports
- [zkrsa](https://github.com/dmpierre/zkrsa/tree/main): ZK Circuit to prove RSA signature onchain and frontend to generate the proofs

### Roadmap

- ✅ Make sure we can extract the signature from a passport
- ✅ Make sure we can actually verify that a passport signature is signed by the issuing country
- ✅ Modify the Next.js frontend of `zkrsa` in order to accept an endpoint that stores signature data from someone scanning their passports
- ✅ Get zkrsa working with the signature format we are able to retrieve from the Android app
- ✅ Contract to mint the SBT when proof is valid
- 🚧 WalletConnect integration to get the address
- 🚧 Let user send their proof onchain to mint the SBT
- 🚧 On-chain registry of CSCA pubkeys based on the official ICAO masterlist
- 🚧 Include minter address in the circuit to avoid front-running
- 🚧 Decompose the hashed eContent of the passport into the private user data and reconstitute them in the circuit
- ✅ Modify the Android app to let people send their signature data to the Next.js backend (and store it temporarily)
- 🚧 Safe Module to claim a Safe if holding the right SBT
- 🚧 Using Sismo Data Groups or EAS Attestations to let people prove they own such an SBT without revealing which one
