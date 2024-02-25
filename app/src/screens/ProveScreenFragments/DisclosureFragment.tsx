import React from 'react';
import { YStack, Text, XStack, Checkbox, Image, useWindowDimensions, Input } from 'tamagui';
import { Check } from '@tamagui/lucide-icons';
import { App } from '../../utils/AppClass';
import { attributeToPosition } from '../../../../common/src/constants/constants';



const DisclosureFragment: React.FC<{
    selectedApp: App | null;
    disclosure: any;
    handleDisclosureChange: (key: string) => void;
    passportData: any;
    hideData: boolean;
}> = ({ selectedApp, disclosure, handleDisclosureChange, passportData, hideData }) => {
    const maskString = (input: string): string => {
        if (input.length <= 5) {
            return input.charAt(0) + '*'.repeat(input.length - 1);
        } else {
            return input.charAt(0) + input.charAt(1) + '*'.repeat(input.length - 2);
        }
    }
    const { height, width } = useWindowDimensions();

    return (
        <YStack f={1}>
            <Image
                w={height > 750 ? 150 : 100}
                h={height > 750 ? 190 : 80}
                borderRadius={height > 800 ? "$11" : "$9"}
                source={{
                    uri: USER,
                }}
            />
            <Text fontSize="$5" fontWeight="bold">Hi {hideData ? maskString(getFirstName(passportData.mrz)) : getFirstName(passportData.mrz)} 👋</Text>
            <Text >Enter your address or ens:</Text>
            <Input
                fontSize={13}
                placeholder="anon.eth or 0x023…"
                value={inputValue}
                onChangeText={setInputValue}
                autoCorrect={false}
                autoCapitalize='none'
                borderColor={address != ethers.ZeroAddress ? "#3185FC" : "unset"}
            />

            <YStack mt="$1">
                {selectedApp && Object.keys(selectedApp.disclosure).map((key) => {
                    const key_ = key as string;
                    const indexes = attributeToPosition[key_];
                    const keyFormatted = key_.replace(/_/g, ' ').split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                    const mrzAttribute = passportData.mrz.slice(indexes[0], indexes[1] + 1);
                    const mrzAttributeFormatted = mrzAttribute;

                    return (
                        <XStack key={key} mx="$2" gap="$4" alignItems='center'>
                            <XStack p="$2" onPress={() => handleDisclosureChange(key_)}>
                                <Checkbox
                                    value={key}
                                    checked={disclosure[key_]}
                                    onCheckedChange={() => handleDisclosureChange(key_)}
                                    aria-label={keyFormatted}
                                    size="$5"
                                >
                                    <Checkbox.Indicator >
                                        <Check />
                                    </Checkbox.Indicator>
                                </Checkbox>
                            </XStack>
                            <Text fontWeight="bold">{keyFormatted}: </Text>
                            <Text>{hideData ? maskString(mrzAttributeFormatted) : mrzAttributeFormatted}</Text>
                        </XStack>
                    );
                })}
            </YStack>
        </YStack>
    );
};

export default DisclosureFragment;
