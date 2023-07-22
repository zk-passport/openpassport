import { screen, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Verify from '../../src/pages/verify';
import proof from '../../__mocks__/proofs/correct.json';
import verifier from '../../__mocks__/vk/verifier.json';

import { validity, downloadVerifier } from '../../src/utils/zk';
import { Proof } from '../../src/types';

jest.mock('../../src/utils/zk', () => {
    const zk = jest.requireActual('../../src/utils/zk');
    return {
        ...zk,
        downloadVerifier: jest.fn((url: string) => verifier),
    };
});
describe('Testing verify page', () => {
    it('Test validity function', async () => {
        const downloadedVerifier = await downloadVerifier('from-test');
        const isValid = await validity(
            downloadedVerifier,
            proof.proof,
            proof.publicSignals
        );
        expect(isValid).toBe(true);
    });
});
