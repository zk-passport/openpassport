import { render } from '@testing-library/react';
import { HashMessage } from '../../src/components/Hashing';
import React from 'react';

jest.spyOn(React, 'useEffect').mockImplementation((f) => {});

describe('Testing Hashing', () => {
    describe('HashMessage', () => {
        it('displays hash value to user', () => {
            const { container } = render(
                <HashMessage
                    sethashValue={() => {}}
                    setuserText={() => {}}
                    userText={'hello'}
                    hashValue={'someHash'}
                />
            );
            expect(container).toHaveTextContent('someHash');
        });
    });
});
