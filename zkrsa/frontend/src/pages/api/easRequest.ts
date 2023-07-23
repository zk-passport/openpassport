import { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import {
    EAS,
    Offchain,
    SchemaEncoder,
    SchemaRegistry,
} from '@ethereum-attestation-service/eas-sdk';
import { ethers } from 'ethers';

export const EASContractAddress = '0x1a5650d0ecbca349dd84bafa85790e3e6955eb84'; // Sepolia v0.26

dotenv.config();

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const { proof, publicSignals, address } = req.body;
    // TODO : verify proof using snarkjs

    let addr = address;
    console.log('addr', addr);

    addr = '0x9D392187c08fc28A86e1354aD63C70897165b982';

    // Initialize the sdk with the address of the EAS Schema contract address
    const eas = new EAS(EASContractAddress);

    // Gets a default provider (in production use something else like infura/alchemy)
    const provider = new ethers.JsonRpcProvider(
        'https://optimism-goerli.public.blastapi.io'
    );

    const signer = new ethers.Wallet(process.env.PKEY as string, provider);
    eas.connect(
        // @ts-ignore
        signer
    );

    // Initialize SchemaEncoder with the schema string
    const schemaEncoder = new SchemaEncoder('bool human');
    const encodedData = schemaEncoder.encodeData([
        { name: 'human', value: true, type: 'bool' },
    ]);

    // const tx = await eas.attest({
    //     schema: '0x2ddd821cd830fd8d43079f50df546adf2f98ca542e98299bbae5a30765fa9709',
    //     data: {
    //         recipient: '0xFD50b031E778fAb33DfD2Fc3Ca66a1EeF0652165',
    //         expirationTime: 0,
    //         revocable: true,
    //         data: encodedData,
    //     },
    // });

    // return tx;

    // Connects an ethers style provider/signingProvider to perform read/write functions.
    // MUST be a signer to do write operations!

    const offchain = await eas.getOffchain();

    const offchainAttestation = await offchain.signOffchainAttestation(
        {
            recipient: '0xC2679fBD37d54388Ce493F1DB75320D236e1815e',
            expirationTime: 0,
            time: 1671219636,
            revocable: true,
            version: 1,
            nonce: 0,
            schema: '0xc37775603123ae0f6c120fade2678aedd55b47f3f22f0de1bfa461f0c8a62243',
            refUID: '0x0000000000000000000000000000000000000000000000000000000000000000',
            data: encodedData,
        },
        // @ts-ignore
        signer
    );

    return offchainAttestation;
}
