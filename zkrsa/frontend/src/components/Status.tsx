import { FunctionComponent } from 'react';
import { PropsStatusVKey } from '../types';

export const StatusVKey: FunctionComponent<PropsStatusVKey> = ({
    vkey,
    vkeyState,
}) => {
    return (
        <div className="mr-5 self-center text-beige font-roboto-light-300">
            {vkeyState}
        </div>
    );
};
