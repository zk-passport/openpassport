import {
    ButtonGenerateProof,
    ButtonExportProof,
} from '../../src/components/Buttons';
import { render } from '@testing-library/react';
import React from 'react';

const setpublicSignals = jest.fn(() => {});
const setproof = jest.fn(() => {});
const setcompiledCircuit = jest.fn(() => {});

jest.spyOn(React, 'useEffect').mockImplementation((f) => null);

describe('Testing buttons', () => {
    describe('ButtonGenerateProof', () => {
        it('disables button when vkeyProof && hash && signature && publicKey is falsy', () => {
            //@dev: mocking useEffect for now (custom Worker implem)
            const { container } = render(
                <ButtonGenerateProof
                    setpublicSignals={setpublicSignals}
                    setproof={setproof}
                    setcompiledCircuit={setcompiledCircuit}
                    hash={''}
                    signature={null}
                    publicKey={''}
                    vkeyProof={''}
                    vkeyVerifier={''}
                />
            );
            const button = container.querySelector('button');
            expect(button).toBeDisabled();
        });
        it('enables button when vkeyProof && hash && signature && publicKey is truthy', () => {
            const { container } = render(
                <ButtonGenerateProof
                    setpublicSignals={setpublicSignals}
                    setproof={setproof}
                    setcompiledCircuit={setcompiledCircuit}
                    hash={'someHash'}
                    signature={'someSignature'}
                    publicKey={'somePublicKey'}
                    vkeyProof={'someProof'}
                    vkeyVerifier={''}
                />
            );
            const button = container.querySelector('button');
            expect(button).toBeEnabled();
        });
    });
    describe('Testing ButtonExportProof', () => {
        it("displays a 'Download' text when there are proof and public signals", () => {
            const { container } = render(
                <ButtonExportProof
                    proof={'proof'}
                    publicSignals={'publicSignal'}
                />
            );
            const buttonLink = container.querySelector('a');
            expect(buttonLink?.text).toEqual('Download');
        });
        it('does not display anything when there are no proof and public signals', () => {
            const { container } = render(
                <ButtonExportProof proof={null} publicSignals={null} />
            );
            expect(container.children).toHaveLength(0);
        });
    });
});
