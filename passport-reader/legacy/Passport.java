/*
 * JMRTD - A Java API for accessing machine readable travel documents.
 *
 * Copyright (C) 2006 - 2014  The JMRTD team
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA
 *
 * $Id: Passport.java 1568 2015-01-12 20:54:05Z martijno $
 */

package org.jmrtd;

import java.io.ByteArrayInputStream;
import java.io.DataInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigInteger;
import java.security.GeneralSecurityException;
import java.security.Key;
import java.security.KeyStore;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.PrivateKey;
import java.security.Provider;
import java.security.PublicKey;
import java.security.SecureRandom;
import java.security.Security;
import java.security.Signature;
import java.security.cert.CertPath;
import java.security.cert.CertPathBuilder;
import java.security.cert.CertPathBuilderException;
import java.security.cert.CertStore;
import java.security.cert.CertStoreParameters;
import java.security.cert.Certificate;
import java.security.cert.CertificateException;
import java.security.cert.CollectionCertStoreParameters;
import java.security.cert.PKIXBuilderParameters;
import java.security.cert.PKIXCertPathBuilderResult;
import java.security.cert.TrustAnchor;
import java.security.cert.X509CertSelector;
import java.security.cert.X509Certificate;
import java.security.interfaces.ECPublicKey;
import java.security.interfaces.RSAPublicKey;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;
import java.util.TreeMap;
import java.util.TreeSet;
import java.util.logging.Logger;

import javax.crypto.Cipher;
import javax.security.auth.x500.X500Principal;

import net.sf.scuba.smartcards.CardFileInputStream;
import net.sf.scuba.smartcards.CardServiceException;

import org.bouncycastle.asn1.ASN1Encodable;
import org.bouncycastle.asn1.ASN1Integer;
import org.bouncycastle.asn1.ASN1Sequence;
import org.bouncycastle.asn1.DERSequence;
import org.jmrtd.VerificationStatus.HashMatchResult;
import org.jmrtd.VerificationStatus.ReasonCode;
import org.jmrtd.cert.CVCPrincipal;
import org.jmrtd.cert.CardVerifiableCertificate;
import org.jmrtd.lds.ActiveAuthenticationInfo;
import org.jmrtd.lds.COMFile;
import org.jmrtd.lds.CVCAFile;
import org.jmrtd.lds.CardAccessFile;
import org.jmrtd.lds.ChipAuthenticationPublicKeyInfo;
import org.jmrtd.lds.DG14File;
import org.jmrtd.lds.DG15File;
import org.jmrtd.lds.DG1File;
import org.jmrtd.lds.LDS;
import org.jmrtd.lds.LDSFileUtil;
import org.jmrtd.lds.PACEInfo;
import org.jmrtd.lds.SODFile;
import org.jmrtd.lds.SecurityInfo;

/**
 * Contains methods for creating instances from scratch, from file, and from
 * card service.
 * 
 * Also contains the document verification logic.
 *
 * @author Wojciech Mostowski (woj@cs.ru.nl)
 * @author Martijn Oostdijk (martijn.oostdijk@gmail.com)
 * 
 * @version $Revision: 1568 $
 */
public class Passport {

	private static final Provider BC_PROVIDER = JMRTDSecurityProvider.getBouncyCastleProvider();

	private final static List<BACKeySpec> EMPTY_TRIED_BAC_ENTRY_LIST = Collections.emptyList();
	private final static List<Certificate> EMPTY_CERTIFICATE_CHAIN = Collections.emptyList();

	/** The hash function for DG hashes. */
	private MessageDigest digest;

	private FeatureStatus featureStatus;
	private VerificationStatus verificationStatus;

	/* We use a cipher to help implement Active Authentication RSA with ISO9796-2 message recovery. */
	private transient Signature rsaAASignature;
	private transient MessageDigest rsaAADigest;	
	private transient Cipher rsaAACipher;
	private transient Signature ecdsaAASignature;
	private transient MessageDigest ecdsaAADigest;

	private short cvcaFID = PassportService.EF_CVCA;

	private LDS lds;

	private static final boolean IS_PKIX_REVOCATION_CHECING_ENABLED = false;

	private PrivateKey docSigningPrivateKey;

	private CardVerifiableCertificate cvcaCertificate;

	private PrivateKey eacPrivateKey;

	private PrivateKey aaPrivateKey;

	private static final Logger LOGGER = Logger.getLogger("org.jmrtd");

	/*
	 * FIXME: replace trust store with something simpler.
	 * - Move the URI interpretation functionality to clients.
	 * - Limit public interface in Passport etc. to CertStore / KeyStore / ? extends Key / Certificate only.
	 */
	private MRTDTrustStore trustManager;

	private PassportService service;

	private Random random;

	private Passport() throws GeneralSecurityException {
		this.featureStatus = new FeatureStatus();
		this.verificationStatus = new VerificationStatus();

		this.random = new SecureRandom();

		rsaAADigest = MessageDigest.getInstance("SHA1"); /* NOTE: for output length measurement only. -- MO */
		rsaAASignature = Signature.getInstance("SHA1WithRSA/ISO9796-2", BC_PROVIDER);
		rsaAACipher = Cipher.getInstance("RSA/NONE/NoPadding");

		/* NOTE: These will be updated in doAA after caller has read ActiveAuthenticationSecurityInfo. */
		ecdsaAASignature = Signature.getInstance("SHA256withECDSA", BC_PROVIDER);
		ecdsaAADigest = MessageDigest.getInstance("SHA-256"); /* NOTE: for output length measurement only. -- MO */
	}

	/**
	 * Creates a document from an LDS data structure and additional information.
	 * 
	 * @param lds the logical data structure
	 * @param docSigningPrivateKey the document signing private key
	 * @param trustManager the trust manager (CSCA, CVCA)
	 * 
	 * @throws GeneralSecurityException if error
	 */
	public Passport(LDS lds, PrivateKey docSigningPrivateKey, MRTDTrustStore trustManager) throws GeneralSecurityException {
		this();
		this.trustManager = trustManager;
		this.docSigningPrivateKey = docSigningPrivateKey;
		this.lds = lds;
	}

	/**
	 * Creates a document by reading it from a service.
	 * Access control will be BAC only.
	 * 
	 * @param service the service to read from
	 * @param trustManager the trust manager (CSCA, CVCA)
	 * @param bacKey the BAC key to use
	 * 
	 * @throws CardServiceException on error
	 * @throws GeneralSecurityException if certain security primitives are not supported
	 */
	public Passport(PassportService service, MRTDTrustStore trustManager, BACKeySpec bacKey) throws CardServiceException, GeneralSecurityException {
		this(service, trustManager, Collections.singletonList(bacKey), false, false);
	}

	public Passport(PassportService service, MRTDTrustStore trustManager, BACKeySpec bacKey, boolean shouldDoPACE, boolean shouldDoBACByDefault) throws CardServiceException, GeneralSecurityException {
		this(service, trustManager, Collections.singletonList(bacKey), shouldDoPACE, shouldDoBACByDefault);
	}

	/**
	 * Creates a document by reading it from a service.
	 * 
	 * @param service the service to read from
	 * @param trustManager the trust manager (CSCA, CVCA)
	 * @param bacStore the BAC entries
	 * @param shouldDoPACE whether PACE should be tried before BAC
	 * @param shouldDoBACByDefault whether BAC should be used by default and we should not expect an unprotected document
	 * 
	 * @throws CardServiceException on error
	 * @throws GeneralSecurityException if certain security primitives are not supported
	 */
	public Passport(PassportService service, MRTDTrustStore trustManager, List<BACKeySpec> bacStore, boolean shouldDoPACE, boolean shouldDoBACByDefault) throws CardServiceException, GeneralSecurityException {
		this();
		LOGGER.info("DEBUG: shouldDoBACByDefault = " + shouldDoBACByDefault);
		if (service == null) { throw new IllegalArgumentException("Service cannot be null"); }
		this.service = service;
		if (trustManager == null) {
			trustManager = new MRTDTrustStore();
		}
		this.trustManager = trustManager;

		boolean hasPACE = false;
		boolean isPACESucceeded = false;
		try {
			service.open();

			/* Find out whether this MRTD supports PACE. */
			PACEInfo paceInfo = null;
			try {
				LOGGER.info("Inspecting card access file");
				CardAccessFile cardAccessFile = new CardAccessFile(service.getInputStream(PassportService.EF_CARD_ACCESS));
				Collection<PACEInfo> paceInfos = cardAccessFile.getPACEInfos();
				LOGGER.info("DEBUG: found a card access file: paceInfos (" + (paceInfos == null ? 0 : paceInfos.size()) + ") = " + paceInfos);

				if (paceInfos != null && paceInfos.size() > 0) {
					/* FIXME: Multiple PACEInfos allowed? */
					if (paceInfos.size() > 1) { LOGGER.warning("Found multiple PACEInfos " + paceInfos.size()); }
					paceInfo = paceInfos.iterator().next();
					featureStatus.setSAC(FeatureStatus.Verdict.PRESENT);
				}
			} catch (Exception e) {
				/* NOTE: No card access file, continue to test for BAC. */
				LOGGER.info("DEBUG: failed to get card access file: " + e.getMessage());
				e.printStackTrace();
			}

			hasPACE = featureStatus.hasSAC() == FeatureStatus.Verdict.PRESENT;

			if (hasPACE && shouldDoPACE) {
				try {
					isPACESucceeded = tryToDoPACE(service, paceInfo, bacStore.get(0)); // FIXME: only one bac key, DEBUG
				} catch (Exception e) {
					e.printStackTrace();
					LOGGER.info("PACE failed, falling back to BAC");
					isPACESucceeded = false;
				}
			}

			LOGGER.info("DEBUG: calling select applet with isPACESucceeded = " + isPACESucceeded);
			service.sendSelectApplet(isPACESucceeded);
		} catch (CardServiceException cse) {
			throw cse;
		} catch (Exception e) {
			e.printStackTrace();
			throw new CardServiceException("Cannot open document. " + e.getMessage());
		}

		String documentNumber = null;
		
		/* If PACE did not succeed find out whether we need to do BAC. */
		if (!(hasPACE && isPACESucceeded)) {
			boolean shouldDoBAC = shouldDoBACByDefault;
			LOGGER.info("DEBUG: shouldDoBAC = " + shouldDoBAC);

			if (!shouldDoBAC) {
				try {
					/* Attempt to read EF.COM before BAC. */
					LOGGER.info("DEBUG: reading first byte of EF.COM");
					service.getInputStream(PassportService.EF_COM).read();

					if (isPACESucceeded) {
						verificationStatus.setSAC(VerificationStatus.Verdict.SUCCEEDED, ReasonCode.SUCCEEDED);
						featureStatus.setBAC(FeatureStatus.Verdict.UNKNOWN);
						verificationStatus.setBAC(VerificationStatus.Verdict.NOT_CHECKED, ReasonCode.USING_SAC_SO_BAC_NOT_CHECKED, EMPTY_TRIED_BAC_ENTRY_LIST);
					} else {
						/* We failed PACE, and we don't need BAC. */
						featureStatus.setBAC(FeatureStatus.Verdict.NOT_PRESENT);
						verificationStatus.setBAC(VerificationStatus.Verdict.NOT_PRESENT, ReasonCode.NOT_SUPPORTED, EMPTY_TRIED_BAC_ENTRY_LIST);
					}
				} catch (Exception e) {
					LOGGER.info("Attempt to read EF.COM before BAC failed with: " + e.getMessage());
					featureStatus.setBAC(FeatureStatus.Verdict.PRESENT);
					verificationStatus.setBAC(VerificationStatus.Verdict.NOT_CHECKED, ReasonCode.INSUFFICIENT_CREDENTIALS, EMPTY_TRIED_BAC_ENTRY_LIST);
				}

				/* If we have to do BAC, try to do BAC. */
				shouldDoBAC = featureStatus.hasBAC() == FeatureStatus.Verdict.PRESENT;
			}

			if (shouldDoBAC) {
				BACKeySpec bacKeySpec = tryToDoBAC(service, bacStore);
				if (featureStatus.hasBAC() == FeatureStatus.Verdict.UNKNOWN) {
					/* For some reason our test did not result in setting BAC, still apparently BAC is required. */
					featureStatus.setBAC(FeatureStatus.Verdict.PRESENT);
				}
				documentNumber = bacKeySpec.getDocumentNumber();
			}
		}
		this.lds = new LDS();

		/* Pre-read these files that are always present. */
		COMFile comFile = null;
		SODFile sodFile = null;
		DG1File dg1File = null;
		Collection<Integer> dgNumbersAlreadyRead = new TreeSet<Integer>();

		try {
			CardFileInputStream comIn = service.getInputStream(PassportService.EF_COM);
			lds.add(PassportService.EF_COM, comIn, comIn.getLength());
			comFile = lds.getCOMFile();

			CardFileInputStream sodIn = service.getInputStream(PassportService.EF_SOD);
			lds.add(PassportService.EF_SOD, sodIn, sodIn.getLength());
			sodFile = lds.getSODFile();

			CardFileInputStream dg1In = service.getInputStream(PassportService.EF_DG1);
			lds.add(PassportService.EF_DG1, dg1In, dg1In.getLength());
			dg1File = lds.getDG1File();
			dgNumbersAlreadyRead.add(1);
			if (documentNumber == null) { documentNumber = dg1File.getMRZInfo().getDocumentNumber(); }
		} catch (IOException ioe) {
			ioe.printStackTrace();
			LOGGER.warning("Could not read file");
		}

		if (sodFile != null) {
			//			verifyDS(); // DEBUG 2.0.4 too costly to do this on APDU thread?!?!
			//			verifyCS();
		}

		/* Get the list of DGs from EF.SOd, we don't trust EF.COM. */
		List<Integer> dgNumbers = new ArrayList<Integer>();
		if (sodFile != null) {
			dgNumbers.addAll(sodFile.getDataGroupHashes().keySet());
		} else if (comFile != null) {
			/* Get the list from EF.COM since we failed to parse EF.SOd. */
			LOGGER.warning("Failed to get DG list from EF.SOd. Getting DG list from EF.COM.");
			int[] tagList = comFile.getTagList();
			dgNumbers.addAll(toDataGroupList(tagList));
		}
		Collections.sort(dgNumbers); /* NOTE: need to sort it, since we get keys as a set. */

		LOGGER.info("Found DGs: " + dgNumbers);

		Map<Integer, VerificationStatus.HashMatchResult> hashResults = verificationStatus.getHashResults();
		if (hashResults == null) {
			hashResults = new TreeMap<Integer, VerificationStatus.HashMatchResult>();
		}

		if (sodFile != null) {
			/* Initial hash results: we know the stored hashes, but not the computed hashes yet. */
			Map<Integer, byte[]> storedHashes = sodFile.getDataGroupHashes();
			for (int dgNumber: dgNumbers) {
				byte[] storedHash = storedHashes.get(dgNumber);
				VerificationStatus.HashMatchResult hashResult = hashResults.get(dgNumber);
				if (hashResult != null) { continue; }
				if (dgNumbersAlreadyRead.contains(dgNumber)) {
					hashResult = verifyHash(dgNumber);
				} else {
					hashResult = new HashMatchResult(storedHash, null);
				}
				hashResults.put(dgNumber, hashResult);
			}
		}
		verificationStatus.setHT(VerificationStatus.Verdict.UNKNOWN, verificationStatus.getHTReason(), hashResults);

		/* Check EAC support by DG14 presence. */
		if (dgNumbers.contains(14)) {
			featureStatus.setEAC(FeatureStatus.Verdict.PRESENT);
		} else {
			featureStatus.setEAC(FeatureStatus.Verdict.NOT_PRESENT);
		}		
		boolean hasEAC = featureStatus.hasEAC() == FeatureStatus.Verdict.PRESENT;
		List<KeyStore> cvcaKeyStores = trustManager.getCVCAStores();
		if (hasEAC && cvcaKeyStores != null && cvcaKeyStores.size() > 0) {
			tryToDoEAC(service, lds, documentNumber, cvcaKeyStores);
			dgNumbersAlreadyRead.add(14);
		}

		/* Check AA support by DG15 presence. */
		if (dgNumbers.contains(15)) {
			featureStatus.setAA(FeatureStatus.Verdict.PRESENT);
		} else {
			featureStatus.setAA(FeatureStatus.Verdict.NOT_PRESENT);
		}
		boolean hasAA = featureStatus.hasAA() == FeatureStatus.Verdict.PRESENT;
		if (hasAA) {
			try {
				CardFileInputStream dg15In = service.getInputStream(PassportService.EF_DG15);
				lds.add(PassportService.EF_DG15, dg15In, dg15In.getLength());
				DG15File dg15File = lds.getDG15File();
				dgNumbersAlreadyRead.add(15);
			} catch (IOException ioe) {
				ioe.printStackTrace();
				LOGGER.warning("Could not read file");
			} catch (Exception e) {
				verificationStatus.setAA(VerificationStatus.Verdict.NOT_CHECKED, ReasonCode.READ_ERROR_DG15_FAILURE, null);
			}
		} else {
			/* Feature status says: no AA, so verification status should say: no AA. */
			verificationStatus.setAA(VerificationStatus.Verdict.NOT_PRESENT, ReasonCode.NOT_SUPPORTED, null);
		}

		/* Add remaining datagroups to LDS. */
		for (int dgNumber: dgNumbers) {
			if (dgNumbersAlreadyRead.contains(dgNumber)) { continue; }
			if ((dgNumber == 3 || dgNumber == 4) && !verificationStatus.getEAC().equals(VerificationStatus.Verdict.SUCCEEDED)) { continue; }
			try {
				short fid = LDSFileUtil.lookupFIDByDataGroupNumber(dgNumber);
				CardFileInputStream cardFileInputStream = service.getInputStream(fid);
				lds.add(fid, cardFileInputStream, cardFileInputStream.getLength());
			} catch (IOException ioe) {
				LOGGER.warning("Error reading DG" + dgNumber + ": " + ioe.getMessage());
				break; /* out of for loop */
			} catch(CardServiceException ex) {
				/* NOTE: Most likely EAC protected file. So log, ignore, continue with next file. */
				LOGGER.info("Could not read DG" + dgNumber + ": " + ex.getMessage());
			} catch (NumberFormatException nfe) {
				LOGGER.warning("NumberFormatException trying to get FID for DG" + dgNumber);
				nfe.printStackTrace();
			}
		}
	}

	/**
	 * Inserts a file into this document, and updates EF_COM and EF_SOd accordingly.
	 * 
	 * @param fid the FID of the new file
	 * @param bytes the contents of the new file
	 */
	public void putFile(short fid, byte[] bytes) {
		if (bytes == null) { return; }
		try {
			lds.add(fid, new ByteArrayInputStream(bytes), bytes.length);
			// FIXME: is this necessary?
			if(fid != PassportService.EF_COM && fid != PassportService.EF_SOD && fid != cvcaFID) {
				updateCOMSODFile(null);
			}
		} catch (IOException ioe) {
			ioe.printStackTrace();
		}
		verificationStatus.setAll(VerificationStatus.Verdict.UNKNOWN, ReasonCode.UNKNOWN); // FIXME: why all?
	}

	/**
	 * Updates EF_COM and EF_SOd using a new document signing certificate.
	 * 
	 * @param newCertificate a certificate
	 */
	public void updateCOMSODFile(X509Certificate newCertificate) {
		try {
			COMFile comFile = lds.getCOMFile();
			SODFile sodFile = lds.getSODFile();
			String digestAlg = sodFile.getDigestAlgorithm();
			String signatureAlg = sodFile.getDigestEncryptionAlgorithm();
			X509Certificate cert = newCertificate != null ? newCertificate : sodFile.getDocSigningCertificate();
			byte[] signature = sodFile.getEncryptedDigest();
			Map<Integer, byte[]> dgHashes = new TreeMap<Integer, byte[]>();
			List<Short> dgFids = lds.getDataGroupList();
			MessageDigest digest = null;
			digest = MessageDigest.getInstance(digestAlg);
			for (Short fid : dgFids) {
				if (fid != PassportService.EF_COM && fid != PassportService.EF_SOD && fid != cvcaFID) {
					int length = lds.getLength(fid);
					InputStream inputStream = lds.getInputStream(fid);
					if (inputStream ==  null) { LOGGER.warning("Could not get input stream for " + Integer.toHexString(fid)); continue; }
					DataInputStream dataInputStream = new DataInputStream(inputStream);
					byte[] data = new byte[length];
					dataInputStream.readFully(data);
					byte tag = data[0];
					dgHashes.put(LDSFileUtil.lookupDataGroupNumberByTag(tag), digest.digest(data));
					comFile.insertTag((int)(tag & 0xFF));
				}
			}
			if(docSigningPrivateKey != null) {
				sodFile = new SODFile(digestAlg, signatureAlg, dgHashes, docSigningPrivateKey, cert);
			} else {
				sodFile = new SODFile(digestAlg, signatureAlg, dgHashes, signature, cert);            
			}
			lds.add(comFile);
			lds.add(sodFile);
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	public LDS getLDS() {
		return lds;
	}

	/**
	 * Sets the document signing private key.
	 * 
	 * @param docSigningPrivateKey a private key
	 */
	public void setDocSigningPrivateKey(PrivateKey docSigningPrivateKey) {
		this.docSigningPrivateKey = docSigningPrivateKey;
		updateCOMSODFile(null);
	}

	/**
	 * Gets the CVCA certificate.
	 * 
	 * @return a CV certificate or <code>null</code>
	 */
	public CardVerifiableCertificate getCVCertificate() {
		return cvcaCertificate;
	}

	/**
	 * Sets the CVCA certificate.
	 * 
	 * @param cert the CV certificate
	 */
	public void setCVCertificate(CardVerifiableCertificate cert) {
		this.cvcaCertificate = cert;
		try {
			CVCAFile cvcaFile = new CVCAFile(cvcaFID, cvcaCertificate.getHolderReference().getName());
			putFile(cvcaFID, cvcaFile.getEncoded());
		} catch (CertificateException ce) {
			ce.printStackTrace();
		}
	}

	/**
	 * Gets the document signing private key, or <code>null</code> if not present.
	 * 
	 * @return a private key or <code>null</code>
	 */
	public PrivateKey getDocSigningPrivateKey() {
		return docSigningPrivateKey;
	}

	/**
	 * Sets the document signing certificate.
	 * 
	 * @param docSigningCertificate a certificate
	 */
	public void setDocSigningCertificate(X509Certificate docSigningCertificate) {
		updateCOMSODFile(docSigningCertificate);
	}

	/**
	 * Gets the CSCA, CVCA trust store.
	 * 
	 * @return the trust store in use
	 */
	public MRTDTrustStore getTrustManager() {
		return trustManager;
	}

	/**
	 * Gets the private key for EAC, or <code>null</code> if not present.
	 * 
	 * @return a private key or <code>null</code>
	 */
	public PrivateKey getEACPrivateKey() {
		return eacPrivateKey;
	}

	/**
	 * Sets the private key for EAC.
	 * 
	 * @param eacPrivateKey a private key
	 */
	public void setEACPrivateKey(PrivateKey eacPrivateKey) {
		this.eacPrivateKey = eacPrivateKey;
	}

	/**
	 * Sets the public key for EAC.
	 * 
	 * @param eacPublicKey a public key
	 */
	public void setEACPublicKey(PublicKey eacPublicKey) {
		ChipAuthenticationPublicKeyInfo chipAuthenticationPublicKeyInfo = new ChipAuthenticationPublicKeyInfo(eacPublicKey);
		DG14File dg14File = new DG14File(Arrays.asList(new SecurityInfo[] { chipAuthenticationPublicKeyInfo }));		
		putFile(PassportService.EF_DG14, dg14File.getEncoded());
	}

	/**
	 * Gets the private key for AA, or <code>null</code> if not present.
	 * 
	 * @return a private key or <code>null</code>
	 */
	public PrivateKey getAAPrivateKey() {
		return aaPrivateKey;
	}

	/**
	 * Sets the private key for AA.
	 * 
	 * @param aaPrivateKey a private key
	 */
	public void setAAPrivateKey(PrivateKey aaPrivateKey) {
		this.aaPrivateKey = aaPrivateKey;
	}

	/**
	 * Sets the public key for AA.
	 * 
	 * @param aaPublicKey a public key
	 */
	public void setAAPublicKey(PublicKey aaPublicKey) {
		DG15File dg15file = new DG15File(aaPublicKey);
		putFile(PassportService.EF_DG15, dg15file.getEncoded());
	}

	/**
	 * Gets the supported features (such as: BAC, AA, EAC) as
	 * discovered during initialization of this document.
	 * 
	 * @return the supported features
	 * 
	 * @since 0.4.9
	 */
	public FeatureStatus getFeatures() {
		/* The feature status has been created in constructor. */
		return featureStatus;
	}

	/**
	 * Gets the verification status thus far.
	 * 
	 * @return the verification status
	 * 
	 * @since 0.4.9
	 */
	public VerificationStatus getVerificationStatus() {
		return verificationStatus;
	}

	/* ONLY PRIVATE METHODS BELOW. */

	private BACKeySpec tryToDoBAC(PassportService service, List<BACKeySpec> bacStore) throws BACDeniedException {
		List<BACKeySpec> triedBACEntries = new ArrayList<BACKeySpec>();
		int lastKnownSW = BACDeniedException.SW_NONE;

		synchronized (bacStore) {
			for (BACKeySpec bacKey: bacStore) {
				try {
					triedBACEntries.add(bacKey);
					tryToDoBAC(service, bacKey);
					verificationStatus.setBAC(VerificationStatus.Verdict.SUCCEEDED, ReasonCode.SUCCEEDED, triedBACEntries);
					return bacKey;
				} catch (CardServiceException cse) {
					LOGGER.info("Ignoring the following exception: " + cse.getClass().getCanonicalName());
					cse.printStackTrace(); // DEBUG: this line was commented in production
					lastKnownSW = cse.getSW();
					/* NOTE: BAC failed? Try next BACEntry */
				}
			}
		}

		/* Document requires BAC, but we failed to authenticate. */
		verificationStatus.setBAC(VerificationStatus.Verdict.FAILED, ReasonCode.INSUFFICIENT_CREDENTIALS, triedBACEntries);
		throw new BACDeniedException("Basic Access denied!", triedBACEntries, lastKnownSW);
	}

	private void tryToDoBAC(PassportService service, BACKeySpec bacKey) throws CardServiceException {
		try {
			LOGGER.info("Trying BAC: " + bacKey);
			service.doBAC(bacKey);
			/* NOTE: if successful, doBAC te catch (CardServiceException cse) {
			e.thrrminates normally, otherwise exception. */
		} catch (Exception e) {
			if (e instanceof CardServiceException) { throw (CardServiceException)e; }
			LOGGER.warning("DEBUG: Unexpected exception " + e.getClass().getCanonicalName() + " during BAC with " + bacKey);
			e.printStackTrace();
			throw new CardServiceException(e.getMessage());
		}
	}

	private boolean tryToDoPACE(PassportService service, PACEInfo paceInfo, BACKeySpec bacKey) throws CardServiceException {
		//		LOGGER.info("DEBUG: PACE has been disabled in this version of JMRTD");
		//		return false;

		LOGGER.info("DEBUG: attempting doPACE with PACEInfo " + paceInfo);
		service.doPACE(bacKey, paceInfo.getObjectIdentifier(), PACEInfo.toParameterSpec(paceInfo.getParameterId()));
		return true;
	}

	private void tryToDoEAC(PassportService service, LDS lds, String documentNumber, List<KeyStore> cvcaKeyStores) throws CardServiceException {
		DG14File dg14File = null;
		CVCAFile cvcaFile = null;

		try {
			try {
				/* Make sure DG14 is read. */
				CardFileInputStream dg14In = service.getInputStream(PassportService.EF_DG14);
				lds.add(PassportService.EF_DG14, dg14In, dg14In.getLength());
				dg14File = lds.getDG14File();

				/* Now try to deal with EF.CVCA. */
				cvcaFID = PassportService.EF_CVCA; /* Default CVCA file Id */
				List<Short> cvcaFIDs = dg14File.getCVCAFileIds();
				if (cvcaFIDs != null && cvcaFIDs.size() != 0) {
					if (cvcaFIDs.size() > 1) { LOGGER.warning("More than one CVCA file id present in DG14"); }
					cvcaFID = cvcaFIDs.get(0).shortValue(); /* Possibly different from default. */
				}
				CardFileInputStream cvcaIn = service.getInputStream(cvcaFID);
				lds.add(cvcaFID, cvcaIn, cvcaIn.getLength());
				cvcaFile = lds.getCVCAFile();
			} catch (IOException ioe) {
				ioe.printStackTrace();
				LOGGER.warning("Could not read EF.DG14 or EF.CVCA, not attempting EAC");
				return;
			}

			/* Try to do EAC. */
			CVCPrincipal[] possibleCVCAReferences = new CVCPrincipal[]{ cvcaFile.getCAReference(), cvcaFile.getAltCAReference() };
			for (CVCPrincipal caReference: possibleCVCAReferences) {
				EACCredentials eacCredentials = getEACCredentials(caReference, cvcaKeyStores);
				if (eacCredentials == null) { continue; }

				PrivateKey privateKey = eacCredentials.getPrivateKey();
				Certificate[] chain = eacCredentials.getChain();
				List<CardVerifiableCertificate> terminalCerts = new ArrayList<CardVerifiableCertificate>(chain.length);
				for (Certificate c: chain) { terminalCerts.add((CardVerifiableCertificate)c); }

				Map<BigInteger, PublicKey> cardKeys = dg14File.getChipAuthenticationPublicKeyInfos();
				for (Map.Entry<BigInteger, PublicKey> entry: cardKeys.entrySet()) {
					BigInteger keyId = entry.getKey();
					PublicKey publicKey = entry.getValue();
					try {
						ChipAuthenticationResult chipAuthenticationResult = service.doCA(keyId, publicKey);
						TerminalAuthenticationResult eacResult = service.doTA(caReference, terminalCerts, privateKey, null, chipAuthenticationResult, documentNumber);
						verificationStatus.setEAC(VerificationStatus.Verdict.SUCCEEDED, ReasonCode.SUCCEEDED, eacResult);
					} catch(CardServiceException cse) {
						cse.printStackTrace();
						/* NOTE: Failed? Too bad, try next public key. */
						continue;
					}
				}

				break;
			}
		} catch (Exception e) {
			LOGGER.warning("EAC failed with exception " + e.getMessage());
			e.printStackTrace();
		}
	}

	/**
	 * Encapsulates the terminal key and associated certificte chain for terminal authentication.
	 */
	class EACCredentials {
		private PrivateKey privateKey;
		private Certificate[] chain;

		/**
		 * Creates EAC credentials.
		 * 
		 * @param privateKey
		 * @param chain
		 */
		public EACCredentials(PrivateKey privateKey, Certificate[] chain) {
			this.privateKey = privateKey;
			this.chain = chain;
		}

		public PrivateKey getPrivateKey() {
			return privateKey;
		}

		public Certificate[] getChain() {
			return chain;
		}		
	}

	private EACCredentials getEACCredentials(CVCPrincipal caReference, List<KeyStore> cvcaStores) throws GeneralSecurityException {
		for (KeyStore cvcaStore: cvcaStores) {
			EACCredentials eacCredentials = getEACCredentials(caReference, cvcaStore);
			if (eacCredentials != null) { return eacCredentials; }
		}
		return null;
	}

	/**
	 * Searches the key store for a relevant terminal key and associated certificate chain.
	 *
	 * @param caReference
	 * @param cvcaStore should contain a single key with certificate chain
	 * @return
	 * @throws GeneralSecurityException
	 */
	private EACCredentials getEACCredentials(CVCPrincipal caReference, KeyStore cvcaStore) throws GeneralSecurityException {
		if (caReference == null) { throw new IllegalArgumentException("CA reference cannot be null"); }

		PrivateKey privateKey = null;
		Certificate[] chain = null;

		List<String> aliases = Collections.list(cvcaStore.aliases());
		for (String alias: aliases) {
			if (cvcaStore.isKeyEntry(alias)) {
				Security.insertProviderAt(BC_PROVIDER, 0);
				Key key = cvcaStore.getKey(alias, "".toCharArray());
				if (key instanceof PrivateKey) {
					privateKey = (PrivateKey)key;
				} else {
					LOGGER.warning("skipping non-private key " + alias);
					continue;
				}
				chain = cvcaStore.getCertificateChain(alias);
				return new EACCredentials(privateKey, chain);
			} else if (cvcaStore.isCertificateEntry(alias)) { 
				CardVerifiableCertificate certificate = (CardVerifiableCertificate)cvcaStore.getCertificate(alias);
				CVCPrincipal authRef = certificate.getAuthorityReference();
				CVCPrincipal holderRef = certificate.getHolderReference();
				if (!caReference.equals(authRef)) { continue; }
				/* See if we have a private key for that certificate. */
				privateKey = (PrivateKey)cvcaStore.getKey(holderRef.getName(), "".toCharArray());
				chain = cvcaStore.getCertificateChain(holderRef.getName());
				if (privateKey == null) { continue; }
				LOGGER.fine("found a key, privateKey = " + privateKey);
				return new EACCredentials(privateKey, chain);
			}
			if (privateKey == null || chain == null) {
				LOGGER.severe("null chain or key for entry " + alias + ": chain = " + Arrays.toString(chain) + ", privateKey = " + privateKey);
				continue;
			}
		}
		return null;
	}

	/**
	 * Builds a certificate chain to an anchor using the PKIX algorithm.
	 * 
	 * @param docSigningCertificate the start certificate
	 * @param sodIssuer the issuer of the start certificate (ignored unless <code>docSigningCertificate</code> is <code>null</code>)
	 * @param sodSerialNumber the serial number of the start certificate (ignored unless <code>docSigningCertificate</code> is <code>null</code>)
	 * 
	 * @return the certificate chain
	 */
	private static List<Certificate> getCertificateChain(X509Certificate docSigningCertificate,
			final X500Principal sodIssuer, final BigInteger sodSerialNumber,
			List<CertStore> cscaStores, Set<TrustAnchor> cscaTrustAnchors) {
		List<Certificate> chain = new ArrayList<Certificate>();
		X509CertSelector selector = new X509CertSelector();
		try {

			if (docSigningCertificate != null) {
				selector.setCertificate(docSigningCertificate);
			} else {
				selector.setIssuer(sodIssuer);
				selector.setSerialNumber(sodSerialNumber);
			}

			CertStoreParameters docStoreParams = new CollectionCertStoreParameters(Collections.singleton((Certificate)docSigningCertificate));
			CertStore docStore = CertStore.getInstance("Collection", docStoreParams);

			CertPathBuilder builder = CertPathBuilder.getInstance("PKIX", BC_PROVIDER);
			PKIXBuilderParameters  buildParams = new PKIXBuilderParameters(cscaTrustAnchors, selector);
			buildParams.addCertStore(docStore);
			for (CertStore trustStore: cscaStores) {
				buildParams.addCertStore(trustStore);
			}
			buildParams.setRevocationEnabled(IS_PKIX_REVOCATION_CHECING_ENABLED); /* NOTE: set to false for checking disabled. */
			Security.addProvider(BC_PROVIDER); /* DEBUG: needed, or builder will throw a runtime exception. FIXME! */
			PKIXCertPathBuilderResult result = null;

			try {
				result = (PKIXCertPathBuilderResult)builder.build(buildParams);
			} catch (CertPathBuilderException cpbe) {
				/* NOTE: ignore, result remain null */
			}
			if (result != null) {
				CertPath pkixCertPath = result.getCertPath();
				if (pkixCertPath != null) {
					chain.addAll(pkixCertPath.getCertificates());
				}
			}
			if (docSigningCertificate != null && !chain.contains(docSigningCertificate)) {
				/* NOTE: if doc signing certificate not in list, we add it ourselves. */
				LOGGER.warning("Adding doc signing certificate after PKIXBuilder finished");
				chain.add(0, docSigningCertificate);
			}
			if (result != null) {
				Certificate trustAnchorCertificate = result.getTrustAnchor().getTrustedCert();
				if (trustAnchorCertificate != null && !chain.contains(trustAnchorCertificate)) {
					/* NOTE: if trust anchor not in list, we add it ourselves. */
					LOGGER.warning("Adding trust anchor certificate after PKIXBuilder finished");
					chain.add(trustAnchorCertificate);
				}
			}
		} catch (Exception e) {
			e.printStackTrace();
			LOGGER.info("Building a chain failed (" + e.getMessage() + ").");
		}
		return chain;
	}

	/**
	 * Check active authentication.
	 */
	public void verifyAA() {
		int challengeLength = 8;
		byte[] challenge = new byte[challengeLength];
		random.nextBytes(challenge);
		ActiveAuthenticationResult aaResult = executeAA(challenge);
		verifyAA(aaResult);
	}

	/**
	 * Execute active authentication using the given challenge.
	 *
	 * @param challenge an byte array of length 8
	 */
	public ActiveAuthenticationResult executeAA(byte[] challenge) {
		if (lds == null || service == null) {
			verificationStatus.setAA(VerificationStatus.Verdict.FAILED, ReasonCode.UNKNOWN, null);
			return null;
		}

		try {
			DG15File dg15File = lds.getDG15File();
			if (dg15File == null) {
				verificationStatus.setAA(VerificationStatus.Verdict.FAILED, ReasonCode.READ_ERROR_DG15_FAILURE, null);
				return null;
			}
			PublicKey pubKey = dg15File.getPublicKey();
			String pubKeyAlgorithm = pubKey.getAlgorithm();
			String digestAlgorithm = "SHA1";
			String signatureAlgorithm = "SHA1WithRSA/ISO9796-2";
			if ("EC".equals(pubKeyAlgorithm) || "ECDSA".equals(pubKeyAlgorithm)) {
				DG14File dg14File = lds.getDG14File();
				if (dg14File == null) {
					verificationStatus.setAA(VerificationStatus.Verdict.FAILED, ReasonCode.READ_ERROR_DG14_FAILURE, null);
					return null;
				}
				List<ActiveAuthenticationInfo> activeAuthenticationInfos = dg14File.getActiveAuthenticationInfos();
				int activeAuthenticationInfoCount = (activeAuthenticationInfos == null ? 0 : activeAuthenticationInfos.size());
				if (activeAuthenticationInfoCount < 1) {
					verificationStatus.setAA(VerificationStatus.Verdict.FAILED, ReasonCode.READ_ERROR_DG14_FAILURE, null);
					return null;
				} else if (activeAuthenticationInfoCount > 1) {
					LOGGER.warning("Found " + activeAuthenticationInfoCount + " in EF.DG14, expected 1.");
				}
				ActiveAuthenticationInfo activeAuthenticationInfo = activeAuthenticationInfos.get(0);
				String signatureAlgorithmOID = activeAuthenticationInfo.getSignatureAlgorithmOID();
				signatureAlgorithm = ActiveAuthenticationInfo.lookupMnemonicByOID(signatureAlgorithmOID);
				digestAlgorithm = Util.inferDigestAlgorithmFromSignatureAlgorithm(signatureAlgorithm);
			}
			byte[] response = service.doAA(pubKey, digestAlgorithm, signatureAlgorithm, challenge);
			return new ActiveAuthenticationResult(pubKey, digestAlgorithm, signatureAlgorithm, challenge, response);
		} catch (CardServiceException cse) {
			cse.printStackTrace();
			verificationStatus.setAA(VerificationStatus.Verdict.FAILED, ReasonCode.UNEXPECTED_EXCEPTION_FAILURE, null);
			return null;
		} catch (Exception e) {
			LOGGER.severe("DEBUG: this exception wasn't caught in verification logic (< 0.4.8) -- MO 3. Type is " + e.getClass().getCanonicalName());
			e.printStackTrace();
			verificationStatus.setAA(VerificationStatus.Verdict.FAILED, ReasonCode.UNEXPECTED_EXCEPTION_FAILURE, null);
			return null;
		}
	}

	/**
	 * Check the active authentication result.
	 * 
	 * @param aaResult
	 * @return
	 */
	public boolean verifyAA(ActiveAuthenticationResult aaResult) {
		try {
			PublicKey publicKey = aaResult.getPublicKey();
			String digestAlgorithm = aaResult.getDigestAlgorithm();
			String signatureAlgorithm = aaResult.getSignatureAlgorithm();
			byte[] challenge = aaResult.getChallenge();
			byte[] response = aaResult.getResponse();

			String pubKeyAlgorithm = publicKey.getAlgorithm();
			if ("RSA".equals(pubKeyAlgorithm)) {
				/* FIXME: check that digestAlgorithm = "SHA1" in this case, check (and re-initialize) rsaAASignature (and rsaAACipher). */
				if (!"SHA1".equalsIgnoreCase(digestAlgorithm)
						|| !"SHA-1".equalsIgnoreCase(digestAlgorithm)
						|| !"SHA1WithRSA/ISO9796-2".equalsIgnoreCase(signatureAlgorithm)) {
					LOGGER.warning("Unexpected algorithms for RSA AA: "
							+ "digest algorithm = " + (digestAlgorithm == null ? "null" : digestAlgorithm)
							+ ", signature algorithm = " + (signatureAlgorithm == null ? "null" : signatureAlgorithm));

					rsaAADigest = MessageDigest.getInstance(digestAlgorithm); /* NOTE: for output length measurement only. -- MO */
					rsaAASignature = Signature.getInstance(signatureAlgorithm, BC_PROVIDER);
				}

				RSAPublicKey rsaPublicKey = (RSAPublicKey)publicKey;
				rsaAACipher.init(Cipher.DECRYPT_MODE, rsaPublicKey);
				rsaAASignature.initVerify(rsaPublicKey);

				int digestLength = rsaAADigest.getDigestLength(); /* SHA1 should be 20 bytes = 160 bits */
				assert(digestLength == 20);
				byte[] plaintext = rsaAACipher.doFinal(response);
				byte[] m1 = Util.recoverMessage(digestLength, plaintext);
				rsaAASignature.update(m1);
				rsaAASignature.update(challenge);
				boolean success = rsaAASignature.verify(response);

				if (success) {
					verificationStatus.setAA(VerificationStatus.Verdict.SUCCEEDED, ReasonCode.SIGNATURE_CHECKED, aaResult);
				} else {
					verificationStatus.setAA(VerificationStatus.Verdict.FAILED, ReasonCode.SIGNATURE_FAILURE, aaResult);
				}
				return success;
			} else if ("EC".equals(pubKeyAlgorithm) || "ECDSA".equals(pubKeyAlgorithm)) {
				ECPublicKey ecdsaPublicKey = (ECPublicKey)publicKey;

				if (ecdsaAASignature == null || signatureAlgorithm != null && !signatureAlgorithm.equals(ecdsaAASignature.getAlgorithm())) {
					LOGGER.warning("Re-initializing ecdsaAASignature with signature algorithm " + signatureAlgorithm);
					ecdsaAASignature = Signature.getInstance(signatureAlgorithm);
				}
				if (ecdsaAADigest == null || digestAlgorithm != null && !digestAlgorithm.equals(ecdsaAADigest.getAlgorithm())) {
					LOGGER.warning("Re-initializing ecdsaAADigest with digest algorithm " + digestAlgorithm);
					ecdsaAADigest = MessageDigest.getInstance(digestAlgorithm);					
				}

				ecdsaAASignature.initVerify(ecdsaPublicKey);

				if (response.length % 2 != 0) {
					LOGGER.warning("Active Authentication response is not of even length");
				}

				int l = response.length / 2;
				BigInteger r = Util.os2i(response, 0, l);
				BigInteger s = Util.os2i(response, l, l);

				ecdsaAASignature.update(challenge);

				try {

					ASN1Sequence asn1Sequence = new DERSequence(new ASN1Encodable[] { new ASN1Integer(r), new ASN1Integer(s) });
					boolean success = ecdsaAASignature.verify(asn1Sequence.getEncoded());
					if (success) {
						verificationStatus.setAA(VerificationStatus.Verdict.SUCCEEDED, ReasonCode.SUCCEEDED, aaResult);
					} else {
						verificationStatus.setAA(VerificationStatus.Verdict.FAILED, ReasonCode.SIGNATURE_FAILURE, aaResult);
					}
					return success;
				} catch (IOException ioe) {
					LOGGER.severe("Unexpected exception during AA signature verification with ECDSA");
					ioe.printStackTrace();
					verificationStatus.setAA(VerificationStatus.Verdict.FAILED, ReasonCode.UNEXPECTED_EXCEPTION_FAILURE, aaResult);
					return false;
				}				
			} else {
				LOGGER.severe("Unsupported AA public key type " + publicKey.getClass().getSimpleName());
				verificationStatus.setAA(VerificationStatus.Verdict.FAILED, ReasonCode.UNSUPPORTED_KEY_TYPE_FAILURE, aaResult);
				return false;
			}
		} catch (Exception e) {
			verificationStatus.setAA(VerificationStatus.Verdict.FAILED, ReasonCode.UNEXPECTED_EXCEPTION_FAILURE, aaResult);
			return false;
		}
	}

	/**
	 * Checks the security object's signature.
	 * 
	 * TODO: Check the cert stores (notably PKD) to fetch document signer certificate (if not embedded in SOd) and check its validity before checking the signature.
	 */
	public void verifyDS() {
		try {
			verificationStatus.setDS(VerificationStatus.Verdict.UNKNOWN, ReasonCode.UNKNOWN);

			SODFile sod = lds.getSODFile();

			/* Check document signing signature. */
			X509Certificate docSigningCert = sod.getDocSigningCertificate();
			if (docSigningCert == null) {
				LOGGER.warning("Could not get document signer certificate from EF.SOd");
				// FIXME: We search for it in cert stores. See note at verifyCS.
				// X500Principal issuer = sod.getIssuerX500Principal();
				// BigInteger serialNumber = sod.getSerialNumber();
			}
			if (sod.checkDocSignature(docSigningCert)) {
				verificationStatus.setDS(VerificationStatus.Verdict.SUCCEEDED, ReasonCode.SIGNATURE_CHECKED);
			} else {
				verificationStatus.setDS(VerificationStatus.Verdict.FAILED, ReasonCode.SIGNATURE_FAILURE);
			}
		} catch (NoSuchAlgorithmException nsae) {
			verificationStatus.setDS(VerificationStatus.Verdict.FAILED, ReasonCode.UNSUPPORTED_SIGNATURE_ALGORITHM_FAILURE);
			return; /* NOTE: Serious enough to not perform other checks, leave method. */
		} catch (Exception e) {
			e.printStackTrace();
			verificationStatus.setDS(VerificationStatus.Verdict.FAILED, ReasonCode.UNEXPECTED_EXCEPTION_FAILURE);
			return; /* NOTE: Serious enough to not perform other checks, leave method. */
		}
	}

	/**
	 * Checks the certificate chain.
	 */
	public void verifyCS() {
		try {
			/* Get EF.SOd. */
			SODFile sod = null;
			try {
				sod = lds.getSODFile();
			} catch (IOException ioe) {
				LOGGER.severe("Could not read EF.SOd");
			}
			List<Certificate> chain = new ArrayList<Certificate>();

			if (sod == null) {
				verificationStatus.setCS(VerificationStatus.Verdict.FAILED, ReasonCode.COULD_NOT_BUILD_CHAIN_FAILURE, chain);
				return;
			}

			/* Get doc signing certificate and issuer info. */
			X509Certificate docSigningCertificate = null;
			X500Principal sodIssuer = null;
			BigInteger sodSerialNumber = null;
			try {
				sodIssuer = sod.getIssuerX500Principal();
				sodSerialNumber = sod.getSerialNumber();
				docSigningCertificate = sod.getDocSigningCertificate();
			}  catch (Exception e) {
				LOGGER.warning("Error getting document signing certificate: " + e.getMessage());
				// FIXME: search for it in cert stores?
			}

			if (docSigningCertificate != null) {
				chain.add(docSigningCertificate);
			} else {
				LOGGER.warning("Error getting document signing certificate from EF.SOd");
			}

			/* Get trust anchors. */
			List<CertStore> cscaStores = trustManager.getCSCAStores();
			if (cscaStores == null || cscaStores.size() <= 0) {
				LOGGER.warning("No CSCA certificate stores found.");
				verificationStatus.setCS(VerificationStatus.Verdict.FAILED, ReasonCode.NO_CSCA_TRUST_ANCHORS_FOUND_FAILURE, chain);
			}
			Set<TrustAnchor> cscaTrustAnchors = trustManager.getCSCAAnchors();
			if (cscaTrustAnchors == null || cscaTrustAnchors.size() <= 0) {
				LOGGER.warning("No CSCA trust anchors found.");
				verificationStatus.setCS(VerificationStatus.Verdict.FAILED, ReasonCode.NO_CSCA_TRUST_ANCHORS_FOUND_FAILURE, chain);
			}

			/* Optional internal EF.SOd consistency check. */
			if (docSigningCertificate != null) {
				X500Principal docIssuer = docSigningCertificate.getIssuerX500Principal();
				if (sodIssuer != null && !sodIssuer.equals(docIssuer)) {
					LOGGER.severe("Security object issuer principal is different from embedded DS certificate issuer!");
				}
				BigInteger docSerialNumber = docSigningCertificate.getSerialNumber();
				if (sodSerialNumber != null && !sodSerialNumber.equals(docSerialNumber)) {
					LOGGER.warning("Security object serial number is different from embedded DS certificate serial number!");
				}
			}

			/* Run PKIX algorithm to build chain to any trust anchor. Add certificates to our chain. */
			List<Certificate> pkixChain = getCertificateChain(docSigningCertificate, sodIssuer, sodSerialNumber, cscaStores, cscaTrustAnchors);
			if (pkixChain == null) {
				verificationStatus.setCS(VerificationStatus.Verdict.FAILED, ReasonCode.SIGNATURE_FAILURE, chain);
				return;
			}

			for (Certificate certificate: pkixChain) {
				if (certificate.equals(docSigningCertificate)) { continue; } /* Ignore DS certificate, which is already in chain. */
				chain.add(certificate);
			}

			int chainDepth = chain.size();
			if (chainDepth <= 1) {
				verificationStatus.setCS(VerificationStatus.Verdict.FAILED, ReasonCode.COULD_NOT_BUILD_CHAIN_FAILURE, chain);
				return;
			}
			if (chainDepth > 1 && verificationStatus.getCS().equals(VerificationStatus.Verdict.UNKNOWN)) {
				verificationStatus.setCS(VerificationStatus.Verdict.SUCCEEDED, ReasonCode.FOUND_A_CHAIN_SUCCEEDED, chain);
			}
		} catch (Exception e) {
			e.printStackTrace();
			verificationStatus.setCS(VerificationStatus.Verdict.FAILED, ReasonCode.SIGNATURE_FAILURE, EMPTY_CERTIFICATE_CHAIN);
		}
	}

	/**
	 * Checks hashes in the SOd correspond to hashes we compute.
	 */
	public void verifyHT() {
		/* Compare stored hashes to computed hashes. */
		Map<Integer, VerificationStatus.HashMatchResult> hashResults = verificationStatus.getHashResults();
		if (hashResults == null) {
			hashResults = new TreeMap<Integer, VerificationStatus.HashMatchResult>();
		}

		SODFile sod = null;
		try {
			sod = lds.getSODFile();
		} catch (Exception e) {
			verificationStatus.setHT(VerificationStatus.Verdict.FAILED, ReasonCode.READ_ERROR_SOD_FAILURE, hashResults);
			return;
		}
		Map<Integer, byte[]> storedHashes = sod.getDataGroupHashes();
		for (int dgNumber: storedHashes.keySet()) {
			verifyHash(dgNumber, hashResults);
		}
		if (verificationStatus.getHT().equals(VerificationStatus.Verdict.UNKNOWN)) {
			verificationStatus.setHT(VerificationStatus.Verdict.SUCCEEDED, ReasonCode.ALL_HASHES_MATCH, hashResults);
		} else {
			/* Update storedHashes and computedHashes. */
			verificationStatus.setHT(verificationStatus.getHT(), verificationStatus.getHTReason(), hashResults);
		}
	}

	private HashMatchResult verifyHash(int dgNumber) {
		Map<Integer, VerificationStatus.HashMatchResult> hashResults = verificationStatus.getHashResults();
		if (hashResults == null) {
			hashResults = new TreeMap<Integer, VerificationStatus.HashMatchResult>();
		}
		return verifyHash(dgNumber, hashResults);
	}

	/**
	 * Verifies the hash for the given datagroup.
	 * Note that this will block until all bytes of the datagroup
	 * are loaded.
	 * 
	 * @param dgNumber
	 * @param digest an existing digest that will be reused (this method will reset it)
	 * @param storedHash the stored hash for this datagroup
	 * @param hashResults the hashtable status to update
	 */
	private VerificationStatus.HashMatchResult verifyHash(int dgNumber, Map<Integer, VerificationStatus.HashMatchResult> hashResults) {
		short fid = LDSFileUtil.lookupFIDByTag(LDSFileUtil.lookupTagByDataGroupNumber(dgNumber));

		SODFile sod = null;

		/* Get the stored hash for the DG. */
		byte[] storedHash = null;
		try {
			sod = lds.getSODFile();
			Map<Integer, byte[]> storedHashes = sod.getDataGroupHashes();
			storedHash = storedHashes.get(dgNumber);
		} catch(Exception e) {
			verificationStatus.setHT(VerificationStatus.Verdict.FAILED, ReasonCode.STORED_HASH_NOT_FOUND_FAILURE, hashResults);
			return null;
		}

		/* Initialize hash. */
		String digestAlgorithm = sod.getDigestAlgorithm();
		try {
			digest = getDigest(digestAlgorithm);
		} catch (NoSuchAlgorithmException nsae) {
			verificationStatus.setHT(VerificationStatus.Verdict.FAILED, ReasonCode.UNSUPPORTED_DIGEST_ALGORITHM_FAILURE, null);
			return null; // DEBUG -- MO
		}

		/* Read the DG. */
		byte[] dgBytes = null;
		try {
			InputStream dgIn = null;
			int length = lds.getLength(fid);
			if (length > 0) {
				dgBytes = new byte[length];
				dgIn = lds.getInputStream(fid);
				DataInputStream dgDataIn = new DataInputStream(dgIn);
				dgDataIn.readFully(dgBytes);
			}

			if (dgIn == null && (verificationStatus.getEAC() != VerificationStatus.Verdict.SUCCEEDED) && (fid == PassportService.EF_DG3 || fid == PassportService.EF_DG4)) {
				LOGGER.warning("Skipping DG" + dgNumber + " during HT verification because EAC failed.");
				VerificationStatus.HashMatchResult hashResult = new HashMatchResult(storedHash, null);
				hashResults.put(dgNumber, hashResult);
				return hashResult;
			}
			if (dgIn == null) {
				LOGGER.warning("Skipping DG" + dgNumber + " during HT verification because file could not be read.");
				VerificationStatus.HashMatchResult hashResult = new HashMatchResult(storedHash, null);
				hashResults.put(dgNumber, hashResult);
				return hashResult;
			}

		} catch(Exception e) {
			VerificationStatus.HashMatchResult hashResult = new HashMatchResult(storedHash, null);
			hashResults.put(dgNumber, hashResult);
			verificationStatus.setHT(VerificationStatus.Verdict.FAILED, ReasonCode.UNEXPECTED_EXCEPTION_FAILURE, hashResults);
			return hashResult;
		}

		/* Compute the hash and compare. */
		try {
			byte[] computedHash = digest.digest(dgBytes);
			VerificationStatus.HashMatchResult hashResult = new HashMatchResult(storedHash, computedHash);
			hashResults.put(dgNumber, hashResult);

			if (!Arrays.equals(storedHash, computedHash)) {
				verificationStatus.setHT(VerificationStatus.Verdict.FAILED, ReasonCode.HASH_MISMATCH_FAILURE, hashResults);
			}

			return hashResult;
		} catch (Exception ioe) {
			VerificationStatus.HashMatchResult hashResult = new HashMatchResult(storedHash, null);
			hashResults.put(dgNumber, hashResult);
			verificationStatus.setHT(VerificationStatus.Verdict.FAILED, ReasonCode.UNEXPECTED_EXCEPTION_FAILURE, hashResults);
			return hashResult;
		}
	}

	private MessageDigest getDigest(String digestAlgorithm) throws NoSuchAlgorithmException {
		if (digest != null) {
			digest.reset();
			return digest;
		}
		LOGGER.info("Using hash algorithm " + digestAlgorithm);
		if (Security.getAlgorithms("MessageDigest").contains(digestAlgorithm)) {
			digest = MessageDigest.getInstance(digestAlgorithm);
		} else {
			digest = MessageDigest.getInstance(digestAlgorithm, BC_PROVIDER);
		}
		return digest;
	}

	private List<Integer> toDataGroupList(int[] tagList) {
		if (tagList == null) { return null; }
		List<Integer> dgNumberList = new ArrayList<Integer>(tagList.length);
		for (int tag: tagList) {
			try {
				int dgNumber = LDSFileUtil.lookupDataGroupNumberByTag(tag);
				dgNumberList.add(dgNumber);
			} catch (NumberFormatException nfe) {
				LOGGER.warning("Could not find DG number for tag: " + Integer.toHexString(tag));
				nfe.printStackTrace();
			}
		}
		return dgNumberList;	
	}
}
