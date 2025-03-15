import React from 'react';

import { ScrollView, Separator, XStack, YStack } from 'tamagui';

import { PassportMetadata } from '../../../../common/src/utils/passports/passport_parsing/parsePassportData';
import { Caption } from '../../components/typography/Caption';
import { usePassport } from '../../stores/passportDataProvider';
import { black, slate200, white } from '../../utils/colors';

// TODO clarify if we need more/less keys to be displayed
const dataKeysToLabels: Record<
  keyof Omit<PassportMetadata, 'countryCode' | 'dsc' | 'csca'>,
  string
> = {
  dataGroups: 'Data Groups',
  dg1Size: 'DG1 Size',
  dg1HashSize: 'DG1 Hash Size',
  dg1HashFunction: 'DG1 Hash Function',
  dg1HashOffset: 'DG1 Hash Offset',
  dgPaddingBytes: 'DG Padding Bytes',
  eContentSize: 'eContent Size',
  eContentHashFunction: 'eContent Hash Function',
  eContentHashOffset: 'eContent Hash Offset',
  signedAttrSize: 'Signed Attributes Size',
  signedAttrHashFunction: 'Signed Attributes Hash Function',
  signatureAlgorithm: 'Signature Algorithm',
  curveOrExponent: 'Curve or Exponent',
  saltLength: 'Salt Length',
  signatureAlgorithmBits: 'Signature Algorithm Bits',
  cscaFound: 'CSCA Found',
  cscaHashFunction: 'CSCA Hash Function',
  cscaSignatureAlgorithm: 'CSCA Signature Algorithm',
  cscaCurveOrExponent: 'CSCA Curve or Exponent',
  cscaSaltLength: 'CSCA Salt Length',
  cscaSignatureAlgorithmBits: 'CSCA Signature Algorithm Bits',
};

const InfoRow: React.FC<{
  label: string;
  value: string | number;
}> = ({ label, value }) => (
  <YStack>
    <XStack py="$4" justifyContent="space-between">
      <Caption size="large">{label}</Caption>
      <Caption color={black} size="large">
        {value}
      </Caption>
    </XStack>
    <Separator borderColor={slate200} />
  </YStack>
);

interface PassportDataInfoScreenProps {}

const PassportDataInfoScreen: React.FC<PassportDataInfoScreenProps> = ({}) => {
  const { passportData } = usePassport();

  return (
    <ScrollView px="$4" backgroundColor={white}>
      <YStack f={1} p="$0" gap="$2" jc="flex-start" py="$2">
        {Object.entries(dataKeysToLabels).map(([key, label]) => (
          <InfoRow
            key={key}
            label={label}
            value={
              !passportData?.passportMetadata
                ? ''
                : key === 'cscaFound'
                ? passportData.passportMetadata.cscaFound === true
                  ? 'Yes'
                  : 'No'
                : (passportData.passportMetadata?.[
                    key as keyof PassportMetadata
                  ] as string | number) || 'None'
            }
          />
        ))}
      </YStack>
    </ScrollView>
  );
};

export default PassportDataInfoScreen;
