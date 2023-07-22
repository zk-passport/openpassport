import { render } from '@testing-library/react';
import bigInt from 'big-integer';
import {
    KeyPairDisplay,
    GenerateKeyPair,
} from '../../src/components/GenerateKeyPair';

const setkeyPair = jest.fn(() => {});
const setjsonPublicKey = jest.fn(() => {});
const keyPair = { n: '12345' };
const keyPairText = bigInt(
    Buffer.from(keyPair.n, 'base64').toString('hex'),
    16
).toString();

describe('Testing GenerateKeyPair', () => {
    describe('KeyPairDisplay', () => {
        it('displays correctly the keypair', () => {
            const { container } = render(<KeyPairDisplay keypair={keyPair} />);
            expect(container).toHaveTextContent(keyPairText);
        });
    });
    describe('GenerateKeyPair', () => {
        it('displays a button to generate a keypair', () => {
            const { container } = render(
                <GenerateKeyPair
                    setkeyPair={setkeyPair}
                    setjsonPublicKey={setjsonPublicKey}
                />
            );
            expect(container).toHaveTextContent('Generate key pair');
        });
    });
});
