import type { NextPage } from 'next';
import { useState } from 'react';
import {
    ButtonGenerateProof,
    ButtonExportProof,
    ButtonSearchPassport,
} from '../components/Buttons';
import {
    InputHash,
    InputPassport,
    InputPublicKey,
    InputSignature,
} from '../components/Inputs';
import { NavMenu, Title, Description, Footer } from '../components/Navigation';
import { PropsAppPage } from '../types';
/**
 * @dev for exporting json proof and public signals data
 */
(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};

const Home: NextPage<PropsAppPage> = ({
    proof,
    setproof,
    vkeyVerifier,
    vkeyProof,
}) => {
    const [hash, sethash] = useState<null | string>(null);
    const [passport, setPassport] = useState<null | string>(null);
    const [signature, setsignature] = useState<null | string>(null);
    const [publicKey, setpublicKey] = useState<null | string>(null);
    const [publicSignals, setpublicSignals] = useState<null | any>(null);
    const [compiledCircuit, setcompiledCircuit] = useState(null);

    return (
        <div>
            <Title></Title>
            <Description></Description>
            <NavMenu></NavMenu>
            <div className="flex flex-col space-y-10 items-center">
                <InputPassport setPassport={setPassport}></InputPassport>
                {passport && (
                    <div className="w-1/3 m-auto">
                        <ButtonSearchPassport
                            passport={passport}
                            setHash={sethash}
                            setSignature={setsignature}
                            setPublicKey={setpublicKey}
                        />
                    </div>
                )}
                <InputHash sethash={sethash} hash={hash}></InputHash>
                <InputSignature
                    setsignature={setsignature}
                    signature={signature}
                ></InputSignature>
                <InputPublicKey
                    setpublicKey={setpublicKey}
                    publicKey={publicKey}
                ></InputPublicKey>
            </div>
            <div className="mt-4 flex flex-col w-11/12">
                <ButtonGenerateProof
                    vkeyVerifier={vkeyVerifier}
                    vkeyProof={vkeyProof}
                    setcompiledCircuit={setcompiledCircuit}
                    setpublicSignals={setpublicSignals}
                    hash={hash}
                    signature={signature}
                    publicKey={publicKey}
                    setproof={setproof}
                ></ButtonGenerateProof>
                {proof ? (
                    <ButtonExportProof
                        publicSignals={publicSignals}
                        proof={proof}
                    ></ButtonExportProof>
                ) : null}
            </div>
            <Footer></Footer>
        </div>
    );
};
export default Home;
