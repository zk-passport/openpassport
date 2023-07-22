import { ChangeEvent, Fragment, FunctionComponent, useState } from 'react';
import {
    PropsInputHash,
    PropsInputProof,
    PropsInputPublicKey,
    PropsInputSignature,
    PropsTextInput,
} from '../types';
import {
    InputInvalidity,
    isValidIntegerInput,
    validateProofJSON,
} from '../utils/inputs';

export const textEncoder = new TextEncoder();

export const InputText: FunctionComponent<PropsTextInput> = ({
    setuserText,
}) => {
    return (
        <div className="ml-10 my-10 font-roboto-light-300 text-beige">
            <div>Enter text</div>
            <input
                className="border-b-2 focus:outline-none"
                type="text"
                onChange={(e) => setuserText(e.target.value)}
            />
        </div>
    );
};

export const InputHash: FunctionComponent<PropsInputHash> = ({ sethash }) => {
    const [invalidHash, setinvalidHash] = useState<string | null>(null);
    return (
        <div className="border-gold space-y-2 sm:w-1/3 border-4 p-4 rounded-2xl shadow-xl">
            <div className="font-roboto-light-300  text-beige">
                Enter hash:{' '}
            </div>
            <input
                className="border-b-2 font-work-sans text-beige pl-2 w-full focus:outline-none bg-inherit"
                type="text"
                onChange={(e) =>
                    isValidIntegerInput(e.target.value, sethash, setinvalidHash)
                }
            />
            <div className="text-gold mt-2 text-sm">
                {invalidHash ? invalidHash : <Fragment>&nbsp;</Fragment>}
            </div>
        </div>
    );
};

export const InputSignature: FunctionComponent<PropsInputSignature> = ({
    setsignature,
}) => {
    const [invalidSignature, setinvalidSignature] = useState<string | null>(
        null
    );
    return (
        <div className="border-gold space-y-2 sm:w-1/3 border-4 p-4 rounded-2xl shadow-xl">
            <div className="font-roboto-light-300 text-beige">
                Enter signature:{' '}
            </div>
            <input
                className="border-b-2 w-full font-work-sans text-beige pl-2 w-full focus:outline-none bg-inherit"
                type="text"
                name=""
                id=""
                onChange={(e) =>
                    isValidIntegerInput(
                        e.target.value,
                        setsignature,
                        setinvalidSignature
                    )
                }
            />
            <div className="text-gold mt-2 text-sm">
                {invalidSignature ? (
                    invalidSignature
                ) : (
                    <Fragment>&nbsp;</Fragment>
                )}
            </div>
        </div>
    );
};

export const InputPublicKey: FunctionComponent<PropsInputPublicKey> = ({
    setpublicKey,
}) => {
    const [invalidPublicKey, setinvalidPublicKey] = useState<string | null>(
        null
    );

    return (
        <div className="border-gold space-y-2 sm:w-1/3 border-4 p-4 rounded-2xl shadow-xl">
            <div className="font-roboto-light-300 text-beige">
                Enter public key:{' '}
            </div>
            <input
                className="border-b-2 w-full font-work-sans text-beige pl-2 focus:outline-none bg-inherit"
                type="text"
                name=""
                id=""
                onChange={(e) =>
                    isValidIntegerInput(
                        e.target.value,
                        setpublicKey,
                        setinvalidPublicKey
                    )
                }
            />
            <div className="text-gold mt-2 text-sm">
                {invalidPublicKey ? (
                    invalidPublicKey
                ) : (
                    <Fragment>&nbsp;</Fragment>
                )}
            </div>
        </div>
    );
};

export const InputProof: FunctionComponent<PropsInputProof> = ({
    setuploadedProof,
}) => {
    const [fileInvalid, setfileInvalid] = useState<null | InputInvalidity>(
        null
    );
    const [fileName, setfileName] = useState<null | string>(null);
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const fileReader = new FileReader();
            fileReader.readAsText(e.target.files[0], 'UTF-8');
            const userFilename = e.target.files[0].name;
            fileReader.onload = (e) => {
                if (e.target) {
                    try {
                        const proof = JSON.parse(e.target.result as string);
                        const isValid = validateProofJSON(proof);
                        setfileName(userFilename);
                        setuploadedProof(proof);
                        setfileInvalid(null);
                    } catch (error) {
                        setfileName(userFilename);
                        setuploadedProof(null);
                        setfileInvalid(InputInvalidity.INVALID_PROOF_FILE);
                    }
                }
            };
        }
    };

    return (
        <div className="w-10/12 sm:w-1/3 border-gold border-4 pt-7 pb-7 rounded-2xl shadow-xl">
            <div className="pl-4 font-roboto-light-300 text-beige mb-3">
                Upload proof:{' '}
            </div>
            <div className="flex">
                <div>
                    <input
                        title="input-proof-file"
                        className="hidden"
                        type="file"
                        id="proofFile"
                        onChange={handleChange}
                    />
                    <label
                        className="m-5 hover:cursor-pointer hover:border-gold hover:border-b-2 font-work-sans text-beige focus:outline-none bg-inherit"
                        htmlFor="proofFile"
                    >
                        Choose file
                    </label>
                </div>
            </div>
            <div
                title="valid-proof-file"
                className="ml-5 text-gold mt-2 text-sm"
            >
                {fileInvalid ? `${fileName} ${fileInvalid}` : fileName}
            </div>
        </div>
    );
};
