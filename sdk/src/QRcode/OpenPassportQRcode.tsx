import React, { useEffect, useRef, useState } from 'react';
import { AppType, OpenPassport1StepInputs, OpenPassport1StepVerifier, OpenPassportVerifierReport } from '../index';
import { QRCodeGenerator } from './QRCodeGenerator';
import io from 'socket.io-client';
import { BounceLoader } from 'react-spinners';
import Lottie from 'lottie-react';
import CHECK_ANIMATION from './animations/check_animation.json';
import X_ANIMATION from './animations/x_animation.json';
import LED from './LED';
import { WEBSOCKET_URL } from '../../../common/src/constants/constants';

const ProofSteps = {
  WAITING_FOR_MOBILE: 'WAITING_FOR_MOBILE',
  MOBILE_CONNECTED: 'MOBILE_CONNECTED',
  PROOF_GENERATION_STARTED: 'PROOF_GENERATION_STARTED',
  PROOF_GENERATED: 'PROOF_GENERATED',
  PROOF_VERIFIED: 'PROOF_VERIFIED',
};

interface OpenPassportQRcodeProps {
  appName: string;
  scope: string;
  userId: string;
  requirements?: string[][];
  onSuccess: (proof: OpenPassport1StepInputs, report: OpenPassportVerifierReport) => void;
  devMode?: boolean;
  size?: number;
  websocketUrl?: string;
}

const OpenPassportQRcode: React.FC<OpenPassportQRcodeProps> = ({
  appName,
  scope,
  userId,
  requirements,
  onSuccess,
  devMode = false,
  size = 300,
  websocketUrl = WEBSOCKET_URL,
}) => {
  const [proofStep, setProofStep] = useState(ProofSteps.WAITING_FOR_MOBILE);
  const [proofVerified, setProofVerified] = useState(null);
  const [sessionId, setSessionId] = useState(crypto.randomUUID());
  const [showAnimation, setShowAnimation] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [qrElement, setQrElement] = useState(null);
  const [animationKey, setAnimationKey] = useState(0);

  const qrcodeRef = useRef(null);
  const lottieRef = useRef(null);

  const handleAnimationComplete = () => {
    console.log('Animation completed');
    setShowAnimation(false);
    setProofStep(ProofSteps.WAITING_FOR_MOBILE);
    const newSessionId = crypto.randomUUID();
    setSessionId(newSessionId);
  };

  useEffect(() => {
    const generateQR = async () => {
      const showCaseApp = {
        name: appName,
        scope,
        userId,
        sessionId,
        circuit: 'prove',
        arguments: {
          disclosureOptions: Object.fromEntries(requirements),
        },
      };
      const qr = await QRCodeGenerator.generateQRCode(showCaseApp as AppType, size);
      setQrElement(qr);
    };
    generateQR();
  }, [appName, scope, userId, sessionId, requirements]);

  useEffect(() => {
    const newSocket = io(websocketUrl, {
      path: '/websocket',
      query: { sessionId, clientType: 'web' },
    });

    const handleMobileStatus = async (data) => {
      console.log('Received mobile status:', data.status);
      switch (data.status) {
        case 'mobile_connected':
          setConnectionStatus('mobile_connected');
          setProofStep(ProofSteps.MOBILE_CONNECTED);
          break;
        case 'mobile_disconnected':
          setConnectionStatus('web_connected');
          break;
        case 'proof_generation_started':
          setProofStep(ProofSteps.PROOF_GENERATION_STARTED);
          break;
        case 'proof_generated':
          setProofStep(ProofSteps.PROOF_GENERATED);
          break;
      }

      if (data.proof) {
        const openPassport1StepVerifier = new OpenPassport1StepVerifier({
          scope,
          requirements,
          dev_mode: devMode,
        });

        try {
          const local_proofVerified: OpenPassportVerifierReport = await openPassport1StepVerifier.verify(data.proof);
          setProofVerified({ valid: local_proofVerified.valid });
          setProofStep(ProofSteps.PROOF_VERIFIED);
          newSocket.emit('proof_verified', {
            sessionId,
            proofVerified: local_proofVerified.toString(),
          });
          if (local_proofVerified.valid && onSuccess) {
            onSuccess(data.proof, local_proofVerified);
          }
        } catch (error) {
          console.error('Error verifying proof:', error);
          setProofVerified({ valid: false, error: error.message });
          newSocket.emit('proof_verified', {
            sessionId,
            proofVerified: { valid: false, error: error.message },
          });
        }
      }
    };

    newSocket.on('connect', () => setConnectionStatus('web_connected'));
    newSocket.on('disconnect', () => {
      setConnectionStatus('disconnected');
      setProofStep(ProofSteps.WAITING_FOR_MOBILE);
    });
    newSocket.on('mobile_status', handleMobileStatus);

    return () => {
      newSocket.disconnect();
    };
  }, [sessionId, scope, requirements, devMode, onSuccess, size]);

  useEffect(() => {
    if (qrElement && qrcodeRef.current) {
      qrcodeRef.current.innerHTML = '';
      qrcodeRef.current.appendChild(qrElement);
    }
  }, [qrElement]);

  useEffect(() => {
    if (proofStep === ProofSteps.PROOF_VERIFIED && proofVerified?.valid === true) {
      setShowAnimation(true);
      setAnimationKey((prev) => prev + 1);
    }
  }, [proofStep, proofVerified]);

  const renderProofStatus = () => (
    <div className="flex flex-col items-center w-full">
      <LED
        connectionStatus={connectionStatus as 'disconnected' | 'web_connected' | 'mobile_connected'}
      />
      <div style={{ width: `${size}px`, height: `${size}px` }} className="flex items-center justify-center mt-2">
        {(() => {
          switch (proofStep) {
            case ProofSteps.WAITING_FOR_MOBILE:
            case ProofSteps.MOBILE_CONNECTED:
              return qrElement ? <div ref={qrcodeRef}></div> : null;
            case ProofSteps.PROOF_GENERATION_STARTED:
            case ProofSteps.PROOF_GENERATED:
              return <BounceLoader loading={true} size={200} color="#94FBAB" />;
            case ProofSteps.PROOF_VERIFIED:
              if (proofVerified?.valid === true) {
                return showAnimation ? (
                  <Lottie
                    key={animationKey}
                    lottieRef={lottieRef}
                    animationData={CHECK_ANIMATION}
                    style={{ width: 200, height: 200 }}
                    loop={false}
                    autoplay={true}
                    onComplete={handleAnimationComplete}
                  />
                ) : qrElement ? (
                  <div ref={qrcodeRef}></div>
                ) : null;
              } else {
                return (
                  <Lottie
                    key={animationKey}
                    lottieRef={lottieRef}
                    animationData={X_ANIMATION}
                    style={{ width: 200, height: 200 }}
                    loop={false}
                    autoplay={true}
                    onComplete={handleAnimationComplete}
                  />
                );
              }
            default:
              return null;
          }
        })()}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center w-full">
      {renderProofStatus()}
    </div>
  );
};

export default OpenPassportQRcode;