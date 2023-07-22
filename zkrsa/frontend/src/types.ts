import { Dispatch, SetStateAction } from 'react';

export type SetProof = Dispatch<SetStateAction<Proof | null>>;
export type SetVkeyProof = Dispatch<SetStateAction<any | null>>;

export interface PropsStatusVKey {
    vkey: any | null;
    vkeyState: string;
}

export interface PropsButtonGenerateProof {
    setpublicSignals: Dispatch<SetStateAction<string[]>>;
    setproof: SetProof;
    setcompiledCircuit: Dispatch<SetStateAction<null>>;
    hash: string | null;
    signature: string | null;
    publicKey: string | null;
    vkeyProof: null | any;
    vkeyVerifier: null | any;
}

export interface PropsAppPage {
    proof: Proof;
    setproof: SetProof;
    vkeyState: string;
    setvkeyState: Dispatch<SetStateAction<string>>;
    vkeyVerifier: null | any;
    setvkeyVerifier: Dispatch<SetStateAction<any>>;
    vkeyProof: null | any;
    setvkeyProof: SetVkeyProof;
}

export interface PropsInputProof {
    setuploadedProof: Dispatch<SetStateAction<DownloadableProof | null>>;
}

export interface PropsHashMessage {
    sethashValue: Dispatch<SetStateAction<string | null>>;
    setuserText: Dispatch<SetStateAction<string | null>>;
    userText: string | null;
    hashValue: string | null;
}

export interface PropsButtonExportProof {
    proof: any;
    publicSignals: any;
}

export interface PropsHashText {
    text: string | null;
    hashValue: string | null;
    sethashValue: Dispatch<SetStateAction<string | null>>;
}

export interface PropsTextInput {
    setuserText: Dispatch<SetStateAction<string | null>>;
}

export interface PropsInputHash {
    sethash: Dispatch<SetStateAction<string | null>>;
}

export interface PropsInputSignature {
    setsignature: Dispatch<SetStateAction<string | null>>;
}

export interface PropsInputPublicKey {
    setpublicKey: Dispatch<SetStateAction<string | null>>;
}

export interface PropsSignedMessage {
    keypair: CryptoKeyPair | null;
    message: string | null;
    setSignedMessage: Dispatch<SetStateAction<ArrayBuffer | null>>;
    signedMessage: null | ArrayBuffer;
}

// @dev: generated with quicktype and tweaked
export interface Proof {
    pi_a: string[];
    pi_ap: string[];
    pi_b: Array<string[]>;
    pi_bp: string[];
    pi_c: string[];
    pi_cp: string[];
    pi_kp: string[];
    pi_h: string[];
    protocol: string;
}

export interface DownloadableProof {
    proof: Proof;
    publicSignals: string[];
}
