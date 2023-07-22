import axios from 'axios';

export const downloadVerifier = async (url: string) => {
    const vkeyVerifier = (
        await axios.get(process.env['NEXT_PUBLIC_VKEY_VERIFIER_URL'] as string)
    ).data;
    return vkeyVerifier;
};
