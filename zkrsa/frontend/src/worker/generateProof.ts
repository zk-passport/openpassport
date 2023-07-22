//@ts-ignore
import { unstringifyBigInts } from 'snarkjs/src/stringifybigint';
//@ts-ignore
import snarkjs from 'snarkjs';

addEventListener(
    'message',
    async (event: MessageEvent<{ vkeyProof: any; witness: any }>) => {
        const { proof, publicSignals } = snarkjs.original.genProof(
            unstringifyBigInts(event.data.vkeyProof),
            unstringifyBigInts(event.data.witness)
        );
        postMessage({
            proof,
            publicSignals,
        });
    }
);
