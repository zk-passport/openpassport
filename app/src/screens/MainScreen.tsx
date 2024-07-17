import React, { useState, useEffect, useCallback } from 'react';
import { Linking, Modal, Platform, Pressable } from 'react-native';
import forge from 'node-forge';
import Dialog from "react-native-dialog";
import { ethers } from 'ethers';
// import ressources
import { YStack, XStack, Text, Button, Tabs, Sheet, Label, Fieldset, Input, Switch, H2, Image, useWindowDimensions, H4, H3, Portal } from 'tamagui'
import { HelpCircle, IterationCw, VenetianMask, Cog, CheckCircle2, ChevronLeft, Share, Eraser, CalendarSearch } from '@tamagui/lucide-icons';
import X from '../images/x.png'
import Telegram from '../images/telegram.png'
import Github from '../images/github.png'
import Internet from "../images/internet.png"
import NFC_IMAGE from '../images/nfc.png'
import { ToastViewport } from '@tamagui/toast';
import { ToastMessage } from '../components/ToastMessage';
// import stores
import useUserStore from '../stores/userStore';
import useNavigationStore from '../stores/navigationStore';
// import utils
import { bgColor, borderColor, componentBgColor, componentBgColor2, textColor1, textColor2 } from '../utils/colors';
import { Steps } from '../utils/utils';
import { scan } from '../utils/nfcScanner';
import { CircuitName, fetchZkey } from '../utils/zkeyDownload';
import { contribute } from '../utils/contribute';
// import utils from common
import { mockPassportData_sha256WithRSAEncryption_65537 } from '../../../common/src/utils/mockPassportData';
// import screens
import ProveScreen from './ProveScreen';
import NfcScreen from './NfcScreen';
import CameraScreen from './CameraScreen';
import NextScreen from './NextScreen';
import RegisterScreen from './RegisterScreen';
import SendProofScreen from './SendProofScreen';
import AppScreen from './AppScreen';
import IntroScreen from './IntroScreen';

import DatePicker from 'react-native-date-picker'

const DeepLinkHandler = ({ onSIVReceived }:
  { onSIVReceived: (sivUserID: string) => void }
) => {
  const handleUrl = useCallback((url: string) => {
    console.log('Received URL:', url);
    try {
      // Manual parsing of the URL
      const [baseUrl, queryString] = url.split('?');
      if (queryString) {
        const params = queryString.split('&').reduce((acc, param) => {
          const [key, value] = param.split('=');
          acc[key] = decodeURIComponent(value);
          return acc;
        }, {} as Record<string, string>);

        const sivUserID = params['SIV'];
        if (sivUserID) {
          console.log('Received SIV User ID:', sivUserID);
          onSIVReceived(sivUserID);
        }
      }
    } catch (error) {
      console.error('Error parsing URL:', error);
    }
  }, [onSIVReceived]);

  useEffect(() => {
    // Handler for when the app is not open (cold start)
    const getInitialURL = async () => {
      try {
        const url = await Linking.getInitialURL();
        if (url) {
          handleUrl(url);
        }
      } catch (err) {
        console.warn('An error occurred', err);
      }
    };

    getInitialURL();

    // Handler for when the app is already open
    const urlListener = Linking.addEventListener('url', (event) => {
      handleUrl(event.url);
    });

    return () => {
      urlListener.remove();
    };
  }, [handleUrl]);

  return null;
};

const MainScreen: React.FC = () => {
  const [NFCScanIsOpen, setNFCScanIsOpen] = useState(false);
  const [displayOtherOptions, setDisplayOtherOptions] = useState(false);
  const [SettingsIsOpen, setSettingsIsOpen] = useState(false);
  const [DialogContributeIsOpen, setDialogContributeIsOpen] = useState(false);
  const [dialogDeleteSecretIsOpen, setDialogDeleteSecretIsOpen] = useState(false);
  const [HelpIsOpen, setHelpIsOpen] = useState(false);
  const [sheetIsOpen, setSheetIsOpen] = useState(false);
  const [modalProofStep, setModalProofStep] = useState(0);
  const [dateOfBirthDatePicker, setDateOfBirthDatePicker] = useState(new Date())
  const [dateOfExpiryDatePicker, setDateOfExpiryDatePicker] = useState(new Date())
  const [dateOfBirthDatePickerIsOpen, setDateOfBirthDatePickerIsOpen] = useState(false)
  const [dateOfExpiryDatePickerIsOpen, setDateOfExpiryDatePickerIsOpen] = useState(false)

  const {
    passportNumber,
    dateOfBirth,
    dateOfExpiry,
    deleteMrzFields,
    update,
    clearPassportDataFromStorage,
    clearSecretFromStorage,
    clearProofsFromStorage,
    passportData,
    registered,
    setRegistered,
    localProof,
    dscCertificate
  } = useUserStore()

  const {
    showWarningModal,
    update: updateNavigationStore,
    step,
    setStep,
    selectedTab,
    hideData,
    toast,
    showRegistrationErrorSheet,
    registrationErrorMessage,
  } = useNavigationStore();

  const handleRestart = () => {
    updateNavigationStore({
      selectedTab: "intro",
      selectedApp: null,
      step: Steps.INTRO,
    })
    deleteMrzFields();
  }
  const handleHideData = () => {
    updateNavigationStore({
      hideData: !hideData,
    })
  }

  const handleSkip = () => {
    update({
      passportData: mockPassportData_sha256WithRSAEncryption_65537
    })
    setStep(Steps.NEXT_SCREEN);
    deleteMrzFields();

    // const n_dsc = 121;
    // const k_dsc = 17;
    // const n_csca = 121;
    // const k_csca = 34;
    // const max_cert_bytes = 1664;
    // const dsc = mock_dsc_sha256_rsa_4096;
    // const csca = mock_csca_sha256_rsa_4096;
    // const dscCert = forge.pki.certificateFromPem(dsc);
    // const cscaCert = forge.pki.certificateFromPem(csca);

    // let secret = useUserStore.getState().dscSecret;
    // if (secret === null) {
    //   // Finally, generate CSCA Inputs and request modal server
    //   // Generate a cryptographically secure random secret of (31 bytes)
    //   const secretBytes = forge.random.getBytesSync(31);
    //   secret = BigInt(`0x${forge.util.bytesToHex(secretBytes)}`).toString();
    //   console.log('Generated secret:', secret.toString());
    //   useUserStore.getState().setDscSecret(secret);
    // }


    // const inputs_csca = getCSCAInputs(
    //   secret,
    //   dscCert,
    //   cscaCert,
    //   n_dsc,
    //   k_dsc,
    //   n_csca,
    //   k_csca,
    //   max_cert_bytes,
    //   true
    // );
    // sendCSCARequest(inputs_csca, setModalProofStep);
    toast.show("Using mock passport data!", { type: "info" })
  }

  const castDate = (date: Date) => {
    return (date.toISOString().slice(2, 4) + date.toISOString().slice(5, 7) + date.toISOString().slice(8, 10)).toString();
  }

  const decrementStep = () => {
    if (selectedTab === "scan") {
      setStep(Steps.INTRO);
    }
    if (selectedTab === "nfc") {
      setStep(Steps.MRZ_SCAN);
    }
    else if (selectedTab === "next") {
      setStep(Steps.MRZ_SCAN_COMPLETED);
    }
    else if (selectedTab === "register") {
      setStep(Steps.NEXT_SCREEN);
    }
    else if (selectedTab === "app") {
      setStep(Steps.REGISTER);
    }
    else if (selectedTab === "prove") {
      setStep(Steps.REGISTERED);
    }
    else if (selectedTab === "mint") {
      setStep(Steps.REGISTERED);
    }
  };

  const handleNFCScan = () => {
    if ((Platform.OS === 'ios')) {
      console.log('ios');
      scan(setModalProofStep);
    }
    else {
      console.log('android :)');
      setNFCScanIsOpen(true);
      scan(setModalProofStep);
    }
  }

  function handleContribute() {
    contribute(passportData);
    setDialogContributeIsOpen(false);
  }

  function handleDeleteSecret() {
    clearSecretFromStorage()
    setDialogDeleteSecretIsOpen(false);
  }

  // useEffect(() => {
  //   if (cscaProof && (modalProofStep === ModalProofSteps.MODAL_SERVER_SUCCESS)) {
  //     console.log('CSCA Proof received:', cscaProof);
  //     if ((cscaProof !== null) && (localProof !== null)) {
  //       const sendTransaction = async () => {
  //         const sigAlgFormatted = formatSigAlgNameForCircuit(passportData.signatureAlgorithm, passportData.pubKey.exponent);
  //         const sigAlgIndex = SignatureAlgorithm[sigAlgFormatted as keyof typeof SignatureAlgorithm]
  //         console.log("local proof already generated, sending transaction");
  //         const provider = new ethers.JsonRpcProvider(RPC_URL);
  //         const serverResponse = await sendRegisterTransaction(localProof, cscaProof, sigAlgIndex)
  //         const txHash = serverResponse?.data.hash;
  //         const receipt = await provider.waitForTransaction(txHash);
  //         console.log('receipt status:', receipt?.status);
  //         if (receipt?.status === 0) {
  //           throw new Error("Transaction failed");
  //         }
  //         setRegistered(true);
  //         setStep(Steps.REGISTERED);
  //         toast.show('✅', {
  //           message: "Registered",
  //           customData: {
  //             type: "success",
  //           },
  //         })
  //       }
  //       //sendTransaction();
  //     }

  //   }
  // }, [modalProofStep]);

  useEffect(() => {
    if (passportNumber?.length === 9 && (dateOfBirth?.length === 6 && dateOfExpiry?.length === 6)) {
      toast.show("✅", {

        message: 'Valid passport data entered',
        customData: {
          type: "success"
        },
      })
      setStep(Steps.MRZ_SCAN_COMPLETED);
    }
  }, [passportNumber, dateOfBirth, dateOfExpiry]);

  useEffect(() => {
    if (localProof && dscCertificate) {
      setStep(Steps.REGISTERED);
    }
  }, [localProof, dscCertificate]);


  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    if (step == Steps.INTRO) {
      updateNavigationStore({
        selectedTab: "intro",
      })
      timeoutId = setTimeout(() => {
        setNFCScanIsOpen(false);
      }, 0);
    }
    else if (step == Steps.MRZ_SCAN) {
      updateNavigationStore({
        selectedTab: "scan",
      })
      timeoutId = setTimeout(() => {
        setNFCScanIsOpen(false);
      }, 0);
    }
    else if (step == Steps.MRZ_SCAN_COMPLETED) {
      updateNavigationStore({
        selectedTab: "nfc",
      })
      timeoutId = setTimeout(() => {
        setNFCScanIsOpen(false);
      }, 0);
    }
    else if (step == Steps.NEXT_SCREEN) {
      // Set the timeout and store its ID
      timeoutId = setTimeout(() => {
        setNFCScanIsOpen(false);
      }, 700);
    }
    else if (step == Steps.PROOF_GENERATED) {
      updateNavigationStore({
        selectedTab: "mint",
      })
    }
    if (step == Steps.NEXT_SCREEN) {
      updateNavigationStore({
        selectedTab: "next",
      })
    }
    if (step == Steps.REGISTER) {
      updateNavigationStore({
        selectedTab: "register",
      })
    }
    if (step == Steps.REGISTERED) {
      updateNavigationStore({
        selectedTab: "app",
      })
    }
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [step]);

  const { height } = useWindowDimensions();

  return (
    <>
      <YStack f={1} bc="#161616" mt={Platform.OS === 'ios' ? "$8" : "$0"} >
        <YStack >
          <XStack jc="space-between" ai="center" px="$3">
            <Button p="$2" py="$3" unstyled onPress={decrementStep}>
              <ChevronLeft color={(selectedTab === "intro") ? "transparent" : "#a0a0a0"} />
            </Button>

            <Text fontSize="$6" color="#a0a0a0">
              {selectedTab === "intro" ? "Welcome"
                : selectedTab === "scan" ? "Scan 1/2"
                  : selectedTab === "nfc" ? "Scan 2/2"
                    : selectedTab === "next" ? "Success!"
                      : selectedTab === "register" ? "Certification"
                        : selectedTab === "app" ? "Certification"
                          : "Prove"
              }
            </Text>
            <XStack>
              {/* <Button p="$2" py="$3" unstyled onPress={() => setSettingsIsOpen(true)}><Cog color="#a0a0a0" /></Button> */}
              <Button p="$2" py="$3" unstyled onPress={() => setHelpIsOpen(true)}><HelpCircle color="#a0a0a0" /></Button>
            </XStack>
          </XStack>
          <Sheet
            open={NFCScanIsOpen}
            onOpenChange={setNFCScanIsOpen}
            dismissOnSnapToBottom
            modal
            dismissOnOverlayPress={false}
            disableDrag
            animation="medium"
            snapPoints={[35]}
          >
            <Sheet.Overlay />
            <Sheet.Frame>
              <YStack gap="$5" f={1} pt="$3">
                <H2 textAlign='center'>Ready to scan</H2>
                {step >= Steps.NEXT_SCREEN ? (
                  <CheckCircle2
                    size="$8"
                    alignSelf='center'
                    color="#3185FC"
                    animation="quick"
                  />
                ) : (
                  <Image
                    h="$8"
                    w="$8"
                    alignSelf='center'
                    borderRadius={1000}
                    source={{
                      uri: NFC_IMAGE
                    }}
                  />
                )}
                <Text textAlign='center' px="$5">
                  Move your phone slowly up and down to the last page of your passport. Stop moving when it vibrates. This will take a few seconds.
                </Text>
              </YStack>
            </Sheet.Frame>
          </Sheet>

          <Sheet open={SettingsIsOpen} onOpenChange={setSettingsIsOpen} dismissOnSnapToBottom modal animation="medium" snapPoints={[88]}>
            <Sheet.Overlay />
            <Sheet.Frame bg={bgColor} borderRadius="$9">
              <YStack p="$3" pb="$5" f={1} gap={height > 750 ? "$3" : "$1"} mb="$1.5">
                <XStack gap="$2" ml="$2" >
                  <H2 color={textColor1}>Settings</H2>
                  <Cog color={textColor1} mt="$1" alignSelf='center' size="$2" />
                </XStack>

                <Fieldset gap="$4" mt="$1" horizontal>
                  <Label color={textColor1} width={200} justifyContent="flex-end" htmlFor="restart">
                    Contribute
                  </Label>
                  <Button bg={componentBgColor} jc="center" borderColor={borderColor} borderWidth={1.2} size="$3.5" ml="$2" onPress={() => setDialogContributeIsOpen(true)}>
                    <Share color={textColor1} />
                  </Button>
                </Fieldset>
                <Fieldset horizontal>
                  <Label color={textColor1} width={225} justifyContent="flex-end" htmlFor="restart" >
                    Private mode
                  </Label>
                  <Switch size="$3.5" checked={hideData} onCheckedChange={handleHideData}>
                    <Switch.Thumb animation="bouncy" bc={bgColor} />
                  </Switch>
                </Fieldset>



                <Fieldset horizontal>
                  <Label color={textColor1} width={225} justifyContent="flex-end" htmlFor="restart" >
                    Display other options
                  </Label>
                  <Switch size="$3.5" checked={displayOtherOptions} onCheckedChange={() => setDisplayOtherOptions(!displayOtherOptions)}>
                    <Switch.Thumb animation="bouncy" bc={bgColor} />
                  </Switch>
                </Fieldset>

                <Dialog.Container visible={DialogContributeIsOpen}>
                  <Dialog.Title>Contribute</Dialog.Title>
                  <Dialog.Description>
                    By pressing yes, you accept sending your passport data.
                    Passport data are encrypted and will be deleted once the signature algorithm is implemented.
                  </Dialog.Description>
                  <Dialog.Button onPress={() => setDialogContributeIsOpen(false)} label="Cancel" />
                  <Dialog.Button onPress={() => handleContribute()} label="Contribute" />
                </Dialog.Container>

                <Dialog.Container visible={dialogDeleteSecretIsOpen}>
                  <Dialog.Title>Delete Secret</Dialog.Title>
                  <Dialog.Description>
                    You are about to delete your secret. Be careful! You will not be able to recover your identity.
                  </Dialog.Description>
                  <Dialog.Button onPress={() => setDialogDeleteSecretIsOpen(false)} label="Cancel" />
                  <Dialog.Button onPress={() => handleDeleteSecret()} label="Delete secret" />
                </Dialog.Container>

                {displayOtherOptions && (
                  <>
                    <XStack my="$3" alignSelf='center' h={2} w="80%" bg={componentBgColor} borderRadius={100} />
                    <Fieldset gap="$4" horizontal>
                      <Label color={textColor1} width={200} justifyContent="flex-end" htmlFor="restart">
                        Restart to step 1
                      </Label>
                      <Button bg={componentBgColor} jc="center" borderColor={borderColor} borderWidth={1.2} size="$3.5" ml="$2" onPress={handleRestart}>
                        <IterationCw color={textColor1} />
                      </Button>
                    </Fieldset>

                    <Fieldset gap="$4" mt="$1" horizontal>
                      <Label color={textColor1} width={200} justifyContent="flex-end" htmlFor="skip" >
                        Use mock passport data
                      </Label>
                      <Button bg={componentBgColor} jc="center" borderColor={borderColor} borderWidth={1.2} size="$3.5" ml="$2" onPress={handleSkip}>
                        <VenetianMask color={textColor1} />
                      </Button>
                    </Fieldset>

                    <Fieldset gap="$4" mt="$1" horizontal>
                      <Label color={textColor1} width={200} justifyContent="flex-end" htmlFor="skip" >
                        Delete passport data
                      </Label>
                      <Button bg={componentBgColor} jc="center" borderColor={borderColor} borderWidth={1.2} size="$3.5" ml="$2" onPress={clearPassportDataFromStorage}>
                        <Eraser color={textColor1} />
                      </Button>
                    </Fieldset>

                    <Fieldset gap="$4" mt="$1" horizontal>
                      <Label color={textColor1} width={200} justifyContent="flex-end" htmlFor="skip" >
                        Delete proofs
                      </Label>
                      <Button bg={componentBgColor} jc="center" borderColor={borderColor} borderWidth={1.2} size="$3.5" ml="$2" onPress={clearProofsFromStorage}>
                        <Eraser color={textColor1} />
                      </Button>
                    </Fieldset>

                    <Fieldset gap="$4" mt="$1" horizontal>
                      <Label color={textColor1} width={200} justifyContent="flex-end" htmlFor="skip" >
                        Delete secret (caution)
                      </Label>
                      <Button bg={componentBgColor} jc="center" borderColor={borderColor} borderWidth={1.2} size="$3.5" ml="$2" onPress={() => setDialogDeleteSecretIsOpen(true)}>
                        <Eraser color={textColor2} />
                      </Button>
                    </Fieldset>
                  </>
                )}

                <YStack flex={1} />

                <YStack mb="$0">
                  {/* <Button p="$2.5" borderRadius="$3" bg={componentBgColor} jc="center" borderColor={borderColor} borderWidth={1.2} onPress={() => setSettingsIsOpen(false)} w="80%" alignSelf='center'>
                    <Text color={textColor1} textAlign='center' fow="bold">Close</Text>
                  </Button> */}
                </YStack>
              </YStack>

            </Sheet.Frame>
          </Sheet>

          <Sheet open={HelpIsOpen} onOpenChange={setHelpIsOpen} dismissOnSnapToBottom modal animation="medium" snapPoints={[88]}>
            <Sheet.Overlay />
            <Sheet.Frame bg={bgColor} borderRadius="$9">
              <YStack px="$3" pb="$5" flex={1} >
                <XStack ml="$2" mt="$3" gap="$2">
                  <H2 color={textColor1}>About</H2>
                  <XStack justifyContent="flex-end" f={1} mt="$2" mr="$2" gap="$5">
                    <Pressable onPress={() => Linking.openURL('https://proofofpassport.com')}>
                      <Image
                        source={{ uri: Internet, width: 24, height: 24 }}
                      />
                    </Pressable>
                    <Pressable onPress={() => Linking.openURL('https://t.me/proofofpassport')}>
                      <Image
                        source={{ uri: Telegram, width: 24, height: 24 }}
                      />
                    </Pressable>
                    <Pressable onPress={() => Linking.openURL('https://x.com/proofofpassport')}>
                      <Image
                        source={{ uri: X, width: 24, height: 24 }}
                      />
                    </Pressable>
                    <Pressable onPress={() => Linking.openURL('https://github.com/zk-passport/proof-of-passport')}>
                      <Image
                        tintColor={textColor1}
                        source={{ uri: Github, width: 24, height: 24 }}
                      />
                    </Pressable>
                  </XStack>
                </XStack>
                <YStack flex={1} mt="$3" gap="$5">
                  <YStack >
                    <H3 color={textColor1}>Security and Privacy</H3>
                    <Text color={textColor2} fontSize={16} mt="$1">Proof of Passport uses zero-knowledge cryptography to allow you to prove facts about yourself like humanity, nationality or age without disclosing any information you don’t want to.</Text>
                  </YStack>
                  <YStack >
                    <H3 color={textColor1}>About ZK Proofs</H3>
                    <Text color={textColor2} fontSize={16} mt="$1">Zero-knowledge proofs are an advanced mathematical technique to prove you know something without revealing what that something is. They allow you to convince someone that a statement is true without sharing any details about why it's true, protecting your privacy while still verifying the information.</Text>
                  </YStack>
                  <Fieldset gap="$4" mt="$1" horizontal>
                    <Label color={textColor1} width={200} justifyContent="flex-end" htmlFor="skip" >
                      Use mock passport data
                    </Label>
                    <Button bg={componentBgColor} jc="center" borderColor={borderColor} borderWidth={1.2} size="$3.5" ml="$2" onPress={handleSkip}>
                      <VenetianMask color={textColor1} />
                    </Button>
                  </Fieldset>
                </YStack>
              </YStack>
            </Sheet.Frame>
          </Sheet>

          <Sheet open={sheetIsOpen} onOpenChange={setSheetIsOpen} dismissOnSnapToBottom modal animation="medium" snapPoints={[80]}>
            <Sheet.Overlay />
            <Sheet.Frame bg={bgColor} borderRadius="$9" pt="$2">
              <YStack p="$4" f={1} gap="$3">
                <Text fontSize="$6" mb="$4" color={textColor1}>Please provide the following information</Text>
                <Fieldset gap="$4" horizontal>
                  <Text color={textColor1} width={160} justifyContent="flex-end" fontSize="$4">
                    Passport Number
                  </Text>
                  <Input
                    bg={componentBgColor}
                    color={textColor1}
                    h="$3.5"
                    borderColor={passportNumber?.length === 9 ? "green" : "unset"}
                    flex={1}
                    id="passportnumber"
                    onChangeText={(text) => {
                      update({ passportNumber: text.toUpperCase() })
                    }}
                    value={passportNumber}
                    keyboardType="default"
                  />
                </Fieldset>


                <Fieldset gap="$4" horizontal>
                  <Text color={textColor1} width={160} justifyContent="flex-end" fontSize="$4">
                    Date of birth
                  </Text>
                  <Text color={textColor1}>
                    {dateOfBirthDatePicker.toISOString().slice(0, 10)}
                  </Text>
                  <Button bg="white" onPress={() => setDateOfBirthDatePickerIsOpen(true)}
                    pressStyle={{
                      bg: componentBgColor2,
                      borderColor: componentBgColor2,
                    }}>
                    <CalendarSearch />
                  </Button>
                  <DatePicker
                    modal
                    mode='date'
                    open={dateOfBirthDatePickerIsOpen}
                    date={dateOfBirthDatePicker}
                    onConfirm={(date) => {
                      setDateOfBirthDatePickerIsOpen(false)
                      setDateOfBirthDatePicker(date)
                      update({ dateOfBirth: castDate(date) })
                    }}
                    onCancel={() => {
                      setDateOfBirthDatePickerIsOpen(false)
                    }}
                  />
                  {/* <Input
                    bg={componentBgColor}
                    color={textColor1}
                    h="$3.5"
                    borderColor={dateOfBirth?.length === 6 ? "green" : "unset"}
                    flex={1}
                    id="dateofbirth"
                    onChangeText={(text) => {
                      update({ dateOfBirth: text })
                    }}
                    value={dateOfBirth}
                    keyboardType={Platform.OS === "ios" ? "default" : "number-pad"}
                  /> */}
                </Fieldset>
                <Fieldset gap="$4" horizontal>
                  <Text color={textColor1} width={160} justifyContent="flex-end" fontSize="$4">
                    Date of expiry
                  </Text>
                  <Text color={textColor1}>
                    {dateOfExpiryDatePicker.toISOString().slice(0, 10)}
                  </Text>
                  <Button bg="white" onPress={() => setDateOfExpiryDatePickerIsOpen(true)}
                    pressStyle={{
                      bg: componentBgColor2,
                      borderColor: componentBgColor2,
                    }}>
                    <CalendarSearch />
                  </Button>
                  <DatePicker
                    modal
                    mode='date'
                    open={dateOfExpiryDatePickerIsOpen}
                    date={dateOfExpiryDatePicker}
                    onConfirm={(date) => {
                      setDateOfExpiryDatePickerIsOpen(false)
                      setDateOfExpiryDatePicker(date)
                      update({ dateOfExpiry: castDate(date) })
                    }}
                    onCancel={() => {
                      setDateOfExpiryDatePickerIsOpen(false)
                    }}
                  />
                  {/* <Input
                    bg={componentBgColor}
                    color={textColor1}
                    h="$3.5"
                    borderColor={dateOfExpiry?.length === 6 ? "green" : "unset"}
                    flex={1}
                    id="dateofexpiry"
                    onChangeText={(text) => {
                      update({ dateOfExpiry: text })
                    }}
                    value={dateOfExpiry}
                    keyboardType={Platform.OS === "ios" ? "default" : "number-pad"}
                  /> */}
                </Fieldset>
                <XStack f={1} />
                <YStack mb="$6" gap="$2">
                  <Button
                    bg={textColor1}
                    pressStyle={{
                      bg: componentBgColor2,
                      borderColor: componentBgColor2,
                    }}
                    onPress={() => {
                      setSheetIsOpen(false)
                      setStep(Steps.MRZ_SCAN_COMPLETED)
                    }}
                  >
                    <Text
                      fontSize="$6"
                      color={bgColor}
                    >Submit</Text>
                  </Button>
                  <Button
                    bg="gray"
                    pressStyle={{
                      bg: componentBgColor2,
                      borderColor: componentBgColor2,
                    }}
                    onPress={() => {
                      setSheetIsOpen(false)
                    }}
                  >
                    <Text
                      fontSize="$6"
                      color={bgColor}
                    >Cancel</Text>
                  </Button>
                </YStack>

              </YStack>
            </Sheet.Frame>
          </Sheet>

          <Sheet
            open={showRegistrationErrorSheet}
            onOpenChange={(open: boolean) => {
              updateNavigationStore({
                showRegistrationErrorSheet: open
              })
            }}
            dismissOnSnapToBottom modal animation="medium" snapPoints={[80]}
          >
            <Sheet.Overlay />
            <Sheet.Frame bg={bgColor} borderRadius="$9" pt="$2">
              <YStack p="$4" f={1} gap="$3">
                <H2 textAlign='center' mb="$6" color={textColor1}>Passport unsupported</H2>
                <Text fontSize="$6" mb="$4" color={textColor1}>Unfortunately, your passport is currently not supported. Details:</Text>
                <Text fontSize="$6" mb="$4" textAlign="center" color="#a0a0a0">{registrationErrorMessage} </Text>

                <Text fontSize="$6" mb="$4" color={textColor1}>To help us add support for it, please consider contributing its data!</Text>
                <Fieldset gap="$4" mt="$1" horizontal>
                  <Label color={textColor1} width={200} justifyContent="flex-end" htmlFor="restart">
                    Contribute
                  </Label>
                  <Button bg={componentBgColor} jc="center" borderColor={borderColor} borderWidth={1.2} size="$3.5" ml="$2" onPress={() => setDialogContributeIsOpen(true)}>
                    <Share color={textColor1} />
                  </Button>
                </Fieldset>
              </YStack>
            </Sheet.Frame>
          </Sheet>

          <XStack bc="#343434" h={1.2} />
        </YStack>
        <Tabs f={1} orientation="horizontal" flexDirection="column" defaultValue={"scan"}
          value={selectedTab}
          onValueChange={(value) => updateNavigationStore({ selectedTab: value })}
        >
          <Portal zIndex={999999999999999}>
            <ToastViewport flexDirection="column-reverse" top={75} right={0} left={0} />
          </Portal>
          <ToastMessage />
          <Tabs.Content value="intro" f={1}>
            <IntroScreen />
            {/* <NfcScreen handleNFCScan={handleNFCScan} /> */}
          </Tabs.Content>
          <Tabs.Content value="scan" f={1}>
            <CameraScreen
              sheetIsOpen={sheetIsOpen}
              setSheetIsOpen={setSheetIsOpen}
            />
          </Tabs.Content>
          <Tabs.Content value="nfc" f={1}>
            <NfcScreen
              handleNFCScan={handleNFCScan}
            />
          </Tabs.Content>
          <Tabs.Content value="next" f={1}>
            <NextScreen />
          </Tabs.Content>
          <Tabs.Content value="register" f={1}>
            <RegisterScreen />
          </Tabs.Content>
          <Tabs.Content value="app" f={1}>
            <AppScreen />
          </Tabs.Content>
          <Tabs.Content value="prove" f={1}>
            <ProveScreen />
          </Tabs.Content>
          <Tabs.Content value="mint" f={1}>
            <SendProofScreen />
          </Tabs.Content>
        </Tabs>
      </YStack >
      <Modal visible={showWarningModal.show} animationType="slide" transparent={true}>
        <YStack bc="#161616" p={20} ai="center" jc="center" position="absolute" top={0} bottom={0} left={0} right={0}>
          <YStack bc="#343434" p={20} borderRadius={10} ai="center" jc="center">
            <Text fontWeight="bold" fontSize={18} color="#a0a0a0">👋 Hi</Text>
            <Text mt={10} textAlign="center" color="#a0a0a0">
              The app needs to download a large file ({(showWarningModal.size / 1024 / 1024).toFixed(2)}MB). Please make sure you're connected to a Wi-Fi network before continuing.
            </Text>
            <XStack mt={20}>
              <Button
                onPress={() => {
                  fetchZkey(showWarningModal.circuit as CircuitName);
                  updateNavigationStore({
                    showWarningModal: {
                      show: false,
                      circuit: '',
                      size: 0,
                    }
                  });
                }}
                bc="#4caf50" borderRadius={5} padding={10}
              >
                <Text color="#ffffff">Continue</Text>
              </Button>
            </XStack>
          </YStack>
        </YStack>
      </Modal>
      <DeepLinkHandler onSIVReceived={(sivUserID) => {
        update({
          sivUserID: sivUserID
        })
      }} />
    </>
  );
};

export default MainScreen;
