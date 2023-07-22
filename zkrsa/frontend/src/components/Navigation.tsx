import { NextComponentType } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import github from '../../public/github.png';

export const NavMenu: NextComponentType = () => {
    return (
        <div className="flex flex-col mb-10 items-center justify-center space-y-2 sm:space-y-0 sm:space-x-20 sm:flex-row sm:justify-center">
            <Link href="/">
                <a className="hover:text-gold text-beige text-xl font-bold font-roboto-light-300">
                    Prove
                </a>
            </Link>
            <Link href="/verify">
                <a className="hover:text-gold text-beige text-xl font-bold font-roboto-light-300">
                    Verify
                </a>
            </Link>
        </div>
    );
};

export const Title: NextComponentType = () => {
    return (
        <div className="flex justify-center mt-10 my-4">
            <div className="w-1/2 text-beige text-center font-work-sans text-4xl">
                zkRSA signature verification
            </div>
        </div>
    );
};

export const Footer: NextComponentType = () => {
    return (
        <div className="flex justify-center items-center mt-5 mb-5">
            <div className="w-1/4 text-center self-center">
                <a
                    target={'_blank'}
                    rel={'noreferrer'}
                    href="https://github.com/dmpierre/zkrsa"
                >
                    <Image
                        alt="github-logo"
                        src={github}
                        width={30}
                        height={30}
                    ></Image>
                </a>
            </div>
            <div className="w-1/4 text-center font-work-sans text-beige">
                <a
                    className="hover:text-gold"
                    target={'_blank'}
                    rel={'noreferrer'}
                    href="https://appliedzkp.org/"
                >
                    A P.S.E. project
                </a>
            </div>
        </div>
    );
};

export const Description: NextComponentType = () => {
    return (
        <div className="flex font-roboto-light-300 my-10 text-beige justify-center">
            <div className="w-3/4 text-center">
                Generate a zero-knowledge proof for a valid RSA signature. You
                can generate a signature using our repo{' '}
                <a
                    className="hover:text-gold"
                    href="https://github.com/dmpierre/zkrsa"
                >
                    here
                </a>
                .
            </div>
        </div>
    );
};
