/*
 * Copyright 2016 - 2022 Anton Tananaev (anton.tananaev@gmail.com)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
@file:Suppress("DEPRECATION", "OVERRIDE_DEPRECATION")

package com.tananaev.passportreader

import android.annotation.SuppressLint
import android.app.PendingIntent
import android.content.Intent
import android.graphics.Bitmap
import android.nfc.NfcAdapter
import android.nfc.Tag
import android.nfc.tech.IsoDep
import android.os.AsyncTask
import android.os.Bundle
import android.preference.PreferenceManager
import android.text.Editable
import android.text.TextWatcher
import android.util.Base64
import android.util.Log
import android.view.View
import android.view.WindowManager
import android.widget.EditText
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.snackbar.Snackbar
import com.tananaev.passportreader.ImageUtil.decodeImage
import com.wdullaer.materialdatetimepicker.date.DatePickerDialog
import net.sf.scuba.smartcards.CardService
import org.apache.commons.io.IOUtils
import org.bouncycastle.asn1.ASN1InputStream
import org.bouncycastle.asn1.ASN1Primitive
import org.bouncycastle.asn1.ASN1Sequence
import org.bouncycastle.asn1.ASN1Set
import org.bouncycastle.asn1.x509.Certificate
import org.jmrtd.BACKey
import org.jmrtd.BACKeySpec
import org.jmrtd.PassportService
import org.jmrtd.lds.CardAccessFile
import org.jmrtd.lds.ChipAuthenticationPublicKeyInfo
import org.jmrtd.lds.PACEInfo
import org.jmrtd.lds.SODFile
import org.jmrtd.lds.SecurityInfo
import org.jmrtd.lds.icao.DG14File
import org.jmrtd.lds.icao.DG1File
import org.jmrtd.lds.icao.DG2File
import org.jmrtd.lds.iso19794.FaceImageInfo
import org.json.JSONObject
import java.io.ByteArrayInputStream
import java.io.DataInputStream
import java.io.InputStream
import java.security.KeyStore
import java.security.MessageDigest
import java.security.Signature
import java.security.cert.CertPathValidator
import java.security.cert.CertificateFactory
import java.security.cert.PKIXParameters
import java.security.cert.X509Certificate
import java.security.spec.MGF1ParameterSpec
import java.security.spec.PSSParameterSpec
import java.text.ParseException
import java.text.SimpleDateFormat
import java.util.*
import com.google.gson.Gson;
import java.security.PublicKey
import java.security.spec.X509EncodedKeySpec
import javax.crypto.Cipher

class Response(json: String) : JSONObject(json) {
    val type: String? = this.optString("type")
    val data = this.optJSONArray("data")
        ?.let { 0.until(it.length()).map { i -> it.optJSONObject(i) } } // returns an array of JSONObject
        ?.map { Foo(it.toString()) } // transforms each JSONObject of the array into Foo
}

class Foo(json: String) : JSONObject(json) {
    val id = this.optInt("id")
    val title: String? = this.optString("title")
}

abstract class MainActivity : AppCompatActivity() {

    private lateinit var passportNumberView: EditText
    private lateinit var expirationDateView: EditText
    private lateinit var birthDateView: EditText
    private var passportNumberFromIntent = false
    private var encodePhotoToBase64 = false
    private lateinit var mainLayout: View
    private lateinit var loadingLayout: View

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val preferences = PreferenceManager.getDefaultSharedPreferences(this)
        val dateOfBirth = intent.getStringExtra("dateOfBirth")
        val dateOfExpiry = intent.getStringExtra("dateOfExpiry")
        val passportNumber = intent.getStringExtra("passportNumber")
        encodePhotoToBase64 = intent.getBooleanExtra("photoAsBase64", false)
        if (dateOfBirth != null) {
            PreferenceManager.getDefaultSharedPreferences(this)
                .edit().putString(KEY_BIRTH_DATE, dateOfBirth).apply()
        }
        if (dateOfExpiry != null) {
            PreferenceManager.getDefaultSharedPreferences(this)
                .edit().putString(KEY_EXPIRATION_DATE, dateOfExpiry).apply()
        }
        if (passportNumber != null) {
            PreferenceManager.getDefaultSharedPreferences(this)
                .edit().putString(KEY_PASSPORT_NUMBER, passportNumber).apply()
            passportNumberFromIntent = true
        }

        passportNumberView = findViewById(R.id.input_passport_number)
        expirationDateView = findViewById(R.id.input_expiration_date)
        birthDateView = findViewById(R.id.input_date_of_birth)
        mainLayout = findViewById(R.id.main_layout)
        loadingLayout = findViewById(R.id.loading_layout)

        passportNumberView.setText(preferences.getString(KEY_PASSPORT_NUMBER, null))
        expirationDateView.setText(preferences.getString(KEY_EXPIRATION_DATE, null))
        birthDateView.setText(preferences.getString(KEY_BIRTH_DATE, null))

        passportNumberView.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence, start: Int, before: Int, count: Int) {}
            override fun afterTextChanged(s: Editable) {
                PreferenceManager.getDefaultSharedPreferences(this@MainActivity)
                    .edit().putString(KEY_PASSPORT_NUMBER, s.toString()).apply()
            }
        })

        expirationDateView.setOnClickListener {
            val c = loadDate(expirationDateView)
            val dialog = DatePickerDialog.newInstance(
                { _, year, monthOfYear, dayOfMonth ->
                    saveDate(
                        expirationDateView,
                        year,
                        monthOfYear,
                        dayOfMonth,
                        KEY_EXPIRATION_DATE,
                    )
                },
                c[Calendar.YEAR],
                c[Calendar.MONTH],
                c[Calendar.DAY_OF_MONTH],
            )
            dialog.showYearPickerFirst(true)
            fragmentManager.beginTransaction().add(dialog, null).commit()
        }

        birthDateView.setOnClickListener {
            val c = loadDate(birthDateView)
            val dialog = DatePickerDialog.newInstance(
                { _, year, monthOfYear, dayOfMonth ->
                    saveDate(birthDateView, year, monthOfYear, dayOfMonth, KEY_BIRTH_DATE)
                },
                c[Calendar.YEAR],
                c[Calendar.MONTH],
                c[Calendar.DAY_OF_MONTH],
            )
            dialog.showYearPickerFirst(true)
            fragmentManager.beginTransaction().add(dialog, null).commit()
        }
    }

    override fun onResume() {
        super.onResume()
        val adapter = NfcAdapter.getDefaultAdapter(this)
        if (adapter != null) {
            val intent = Intent(applicationContext, this.javaClass)
            intent.flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
            val pendingIntent = PendingIntent.getActivity(this, 0, intent, PendingIntent.FLAG_MUTABLE)
            val filter = arrayOf(arrayOf("android.nfc.tech.IsoDep"))
            adapter.enableForegroundDispatch(this, pendingIntent, null, filter)
        }
        if (passportNumberFromIntent) {
            // When the passport number field is populated from the caller, we hide the
            // soft keyboard as otherwise it can obscure the 'Reading data' progress indicator.
            window.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_STATE_HIDDEN)
        }
    }

    override fun onPause() {
        super.onPause()
        val adapter = NfcAdapter.getDefaultAdapter(this)
        adapter?.disableForegroundDispatch(this)
    }

    public override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        if (NfcAdapter.ACTION_TECH_DISCOVERED == intent.action) {
            val tag: Tag? = intent.extras?.getParcelable(NfcAdapter.EXTRA_TAG)
            if (tag?.techList?.contains("android.nfc.tech.IsoDep") == true) {
                val preferences = PreferenceManager.getDefaultSharedPreferences(this)
                val passportNumber = preferences.getString(KEY_PASSPORT_NUMBER, null)
                val expirationDate = convertDate(preferences.getString(KEY_EXPIRATION_DATE, null))
                val birthDate = convertDate(preferences.getString(KEY_BIRTH_DATE, null))
                if (!passportNumber.isNullOrEmpty() && !expirationDate.isNullOrEmpty() && !birthDate.isNullOrEmpty()) {
                    val bacKey: BACKeySpec = BACKey(passportNumber, birthDate, expirationDate)
                    ReadTask(IsoDep.get(tag), bacKey).execute()
                    mainLayout.visibility = View.GONE
                    loadingLayout.visibility = View.VISIBLE
                } else {
                    Snackbar.make(passportNumberView, R.string.error_input, Snackbar.LENGTH_SHORT).show()
                }
            }
        }
    }

    @SuppressLint("StaticFieldLeak")
    private inner class ReadTask(private val isoDep: IsoDep, private val bacKey: BACKeySpec) : AsyncTask<Void?, Void?, Exception?>() {

        private lateinit var dg1File: DG1File
        private lateinit var dg2File: DG2File
        private lateinit var dg14File: DG14File
        private lateinit var sodFile: SODFile
        private var imageBase64: String? = null
        private var bitmap: Bitmap? = null
        private var chipAuthSucceeded = false
        private var passiveAuthSuccess = false
        private lateinit var dg14Encoded: ByteArray

        override fun doInBackground(vararg params: Void?): Exception? {
            try {
                isoDep.timeout = 10000
                val cardService = CardService.getInstance(isoDep)
                cardService.open()
                val service = PassportService(
                    cardService,
                    PassportService.NORMAL_MAX_TRANCEIVE_LENGTH,
                    PassportService.DEFAULT_MAX_BLOCKSIZE,
                    false,
                    false,
                )
                service.open()
                var paceSucceeded = false
                try {
                    val cardAccessFile = CardAccessFile(service.getInputStream(PassportService.EF_CARD_ACCESS))
                    val securityInfoCollection = cardAccessFile.securityInfos
                    for (securityInfo: SecurityInfo in securityInfoCollection) {
                        if (securityInfo is PACEInfo) {
                            service.doPACE(
                                bacKey,
                                securityInfo.objectIdentifier,
                                PACEInfo.toParameterSpec(securityInfo.parameterId),
                                null,
                            )
                            paceSucceeded = true
                        }
                    }
                } catch (e: Exception) {
                    Log.w(TAG, e)
                }
                service.sendSelectApplet(paceSucceeded)
                if (!paceSucceeded) {
                    try {
                        service.getInputStream(PassportService.EF_COM).read()
                    } catch (e: Exception) {
                        service.doBAC(bacKey)
                    }
                }
                fun concatenateHashes(dataGroupHashes: Map<Int, ByteArray>): ByteArray {
                    val allHashes = ArrayList<ByteArray>()

                    // Order the data group hashes by their keys and concatenate them
                    for (i in dataGroupHashes.keys.sorted()) {
                        allHashes.add(dataGroupHashes[i]!!)
                    }

                    // Combine all the byte arrays into one
                    val combinedSize = allHashes.sumOf { it.size }
                    val result = ByteArray(combinedSize)
                    var pos = 0
                    for (hash in allHashes) {
                        hash.copyInto(result, pos)
                        pos += hash.size
                    }

                    return result
                }

                Log.d(TAG, "============FIRST CONSOLE LOG=============")
                val gson = Gson()

                val dg1In = service.getInputStream(PassportService.EF_DG1)
                var a = dg1In.toString()
                dg1File = DG1File(dg1In)

                Log.d(TAG, "a")
                Log.d(TAG, a)
                Log.d(TAG, gson.toJson(dg1In))
                Log.d(TAG, dg1File.toString())
                Log.d(TAG, gson.toJson(dg1File))


                val dg2In = service.getInputStream(PassportService.EF_DG2)
                dg2File = DG2File(dg2In)
                var b = dg2In.toString()

                Log.d(TAG, "b")
                Log.d(TAG, b)
                Log.d(TAG, gson.toJson(dg2In))
                Log.d(TAG, dg2In.toString())
                Log.d(TAG, gson.toJson(dg2In))

                val sodIn = service.getInputStream(PassportService.EF_SOD)
                sodFile = SODFile(sodIn)
                var c = sodIn.toString()

                var data = sodFile.dataGroupHashes

                Log.d(TAG, "c")
                Log.d(TAG, c)
                Log.d(TAG, gson.toJson(sodIn))
                Log.d(TAG, sodFile.toString())
                Log.d(TAG, gson.toJson(sodFile))

                Log.d(TAG, "other data :")

                Log.d(TAG, "sodFile.docSigningCertificate: ${sodFile.docSigningCertificate}")
                Log.d(TAG, "publicKey: ${sodFile.docSigningCertificate.publicKey}")
                Log.d(TAG, "publicKey: ${sodFile.docSigningCertificate.publicKey.toString()}")
                Log.d(TAG, "publicKey: ${sodFile.docSigningCertificate.publicKey.format}")
                Log.d(TAG, "publicKey: ${Base64.encodeToString(sodFile.docSigningCertificate.publicKey.encoded, Base64.DEFAULT)}")


                Log.d(TAG, "sodFile.docSigningCertificate: ${gson.toJson(sodFile.docSigningCertificate)}")
                val hexMap = sodFile.dataGroupHashes.mapValues { (_, value) ->
                    value.joinToString("") { "%02x".format(it) }
                }
                Log.d(TAG, "sodFile.dataGroupHashes: ${sodFile.dataGroupHashes}")
                Log.d(TAG, "sodFile.dataGroupHashes: ${gson.toJson(sodFile.dataGroupHashes)}")


                var concatenated = concatenateHashes(sodFile.dataGroupHashes)
                Log.d(TAG, "concatenated: $concatenated")
                Log.d(TAG, "concatenated: ${gson.toJson(concatenated)}")
                Log.d(TAG, "concatenated: ${gson.toJson(concatenated.joinToString("") { "%02x".format(it) })}")
                Log.d(TAG, "hexMap: ${gson.toJson(hexMap)}")
                Log.d(TAG, "sodFile.eContent: ${sodFile.eContent}")
                Log.d(TAG, "sodFile.eContent: ${gson.toJson(sodFile.eContent)}")
                Log.d(TAG, "sodFile.eContent: ${gson.toJson(sodFile.eContent.joinToString("") { "%02x".format(it) })}")
                Log.d(TAG, "sodFile.encryptedDigest: ${sodFile.encryptedDigest}")
                Log.d(TAG, "sodFile.encryptedDigest: ${gson.toJson(sodFile.encryptedDigest)}")
                Log.d(TAG, "sodFile.encryptedDigest: ${gson.toJson(sodFile.encryptedDigest.joinToString("") { "%02x".format(it) })}")

                Log.d(TAG, "============LET'S VERIFY THE SIGNATURE=============")

                // val signatureBytes = ... // your signature bytes
                // val data = ... // your data bytes
                // val publicKeyPEM = ... // your public key string

                // // Remove the first and last lines
                // val publicKeyPEM = publicKeyPEM.replace("-----BEGIN PUBLIC KEY-----", "")
                //     .replace("-----END PUBLIC KEY-----", "")
                //     .replace("\\s".toRegex(), "")

                // // Base64 decode the data
                // val publicKeyBytes = Base64.getDecoder().decode(publicKeyPEM)

                // val keySpec = X509EncodedKeySpec(publicKeyBytes)
                // val keyFactory = KeyFactory.getInstance("RSA")
                // val publicKey = keyFactory.generatePublic(keySpec) as PublicKey

                // val signature = Signature.getInstance("SHA256withRSA")
                // signature.initVerify(publicKey)
                // signature.update(data)

                // val isVerified = signature.verify(signatureBytes)
                // println("Is verified: $isVerified")




                // Log.d(TAG, "Using digest algorithm: $sodIn")
                // Log.d(TAG, "Using digest algorithm: ${gson.toJson(sodIn)}")

                doChipAuth(service)
                doPassiveAuth()

                val allFaceImageInfo: MutableList<FaceImageInfo> = ArrayList()
                dg2File.faceInfos.forEach {
                    allFaceImageInfo.addAll(it.faceImageInfos)
                }
                if (allFaceImageInfo.isNotEmpty()) {
                    val faceImageInfo = allFaceImageInfo.first()
                    val imageLength = faceImageInfo.imageLength
                    val dataInputStream = DataInputStream(faceImageInfo.imageInputStream)
                    val buffer = ByteArray(imageLength)
                    dataInputStream.readFully(buffer, 0, imageLength)
                    val inputStream: InputStream = ByteArrayInputStream(buffer, 0, imageLength)
                    bitmap = decodeImage(this@MainActivity, faceImageInfo.mimeType, inputStream)
                    imageBase64 = Base64.encodeToString(buffer, Base64.DEFAULT)
                }
            } catch (e: Exception) {
                return e
            }
            return null
        }

        private fun doChipAuth(service: PassportService) {
            try {
                val dg14In = service.getInputStream(PassportService.EF_DG14)
                dg14Encoded = IOUtils.toByteArray(dg14In)
                val dg14InByte = ByteArrayInputStream(dg14Encoded)
                dg14File = DG14File(dg14InByte)
                val dg14FileSecurityInfo = dg14File.securityInfos
                for (securityInfo: SecurityInfo in dg14FileSecurityInfo) {
                    if (securityInfo is ChipAuthenticationPublicKeyInfo) {
                        service.doEACCA(
                            securityInfo.keyId,
                            ChipAuthenticationPublicKeyInfo.ID_CA_ECDH_AES_CBC_CMAC_256,
                            securityInfo.objectIdentifier,
                            securityInfo.subjectPublicKey,
                        )
                        chipAuthSucceeded = true
                    }
                }
            } catch (e: Exception) {
                Log.w(TAG, e)
            }
        }

        private fun doPassiveAuth() {
            try {
                Log.d(TAG, "Starting passive authentication...")
                val digest = MessageDigest.getInstance(sodFile.digestAlgorithm)
                Log.d(TAG, "Using digest algorithm: ${sodFile.digestAlgorithm}")

                val gson = Gson()
                Log.d(TAG, "Using digest algorithm: ${gson.toJson(sodFile)}")

                val dataHashes = sodFile.dataGroupHashes

                val dg14Hash = if (chipAuthSucceeded) digest.digest(dg14Encoded) else ByteArray(0)
                val dg1Hash = digest.digest(dg1File.encoded)
                val dg2Hash = digest.digest(dg2File.encoded)

                Log.d(TAG, "Comparing data group hashes...")

                if (Arrays.equals(dg1Hash, dataHashes[1]) && Arrays.equals(dg2Hash, dataHashes[2])
                    && (!chipAuthSucceeded || Arrays.equals(dg14Hash, dataHashes[14]))) {

                    Log.d(TAG, "Data group hashes match.")

                    val asn1InputStream = ASN1InputStream(assets.open("masterList"))
                    val keystore = KeyStore.getInstance(KeyStore.getDefaultType())
                    keystore.load(null, null)
                    val cf = CertificateFactory.getInstance("X.509")

                    var p: ASN1Primitive?
                    Log.d(TAG, "Reading ASN1 sequence...")
                    while (asn1InputStream.readObject().also { p = it } != null) {
                        val asn1 = ASN1Sequence.getInstance(p)
                        if (asn1 == null || asn1.size() == 0) {
                            throw IllegalArgumentException("Null or empty sequence passed.")
                        }
                        Log.d(TAG, asn1.toString()) //byte sequence

                        if (asn1.size() != 2) {
                            throw IllegalArgumentException("Incorrect sequence size: " + asn1.size())
                        }
                        val certSet = ASN1Set.getInstance(asn1.getObjectAt(1))
                        for (i in 0 until certSet.size()) {
                            // Log.d(TAG, "Processing certificate: $i")
                            val certificate = Certificate.getInstance(certSet.getObjectAt(i))
                            val pemCertificate = certificate.encoded
                            val javaCertificate = cf.generateCertificate(ByteArrayInputStream(pemCertificate))
                            keystore.setCertificateEntry(i.toString(), javaCertificate)
                        }
                    }

                    val docSigningCertificates = sodFile.docSigningCertificates
                    Log.d(TAG, "Checking document signing certificates for validity...")
                    for (docSigningCertificate: X509Certificate in docSigningCertificates) {
                        docSigningCertificate.checkValidity()
                        Log.d(TAG, "Certificate: ${docSigningCertificate.subjectDN} is valid.")
                        Log.d(TAG, docSigningCertificate.toString())
                    }

                    val cp = cf.generateCertPath(docSigningCertificates)
                    val pkixParameters = PKIXParameters(keystore)
                    pkixParameters.isRevocationEnabled = false
                    val cpv = CertPathValidator.getInstance(CertPathValidator.getDefaultType())
                    Log.d(TAG, "Validating certificate path...")
                    cpv.validate(cp, pkixParameters)
                    var sodDigestEncryptionAlgorithm = sodFile.docSigningCertificate.sigAlgName
                    var isSSA = false
                    if ((sodDigestEncryptionAlgorithm == "SSAwithRSA/PSS")) {
                        sodDigestEncryptionAlgorithm = "SHA256withRSA/PSS"
                        isSSA = true
                        //Log.d(TAG, sodDigestEncryptionAlgorithm)

                    }
                    val sign = Signature.getInstance(sodDigestEncryptionAlgorithm)
                    if (isSSA) {
                        //Log.d(TAG, isSSA.toString())
                        sign.setParameter(PSSParameterSpec("SHA-256", "MGF1", MGF1ParameterSpec.SHA256, 32, 1))
                    }
                    sign.initVerify(sodFile.docSigningCertificate)
                    sign.update(sodFile.eContent)

                    passiveAuthSuccess = sign.verify(sodFile.encryptedDigest)
                    Log.d(TAG, "Passive authentication success: $passiveAuthSuccess")
                    Log.d(TAG, "============LAST CONSOLE LOG=============")

                }
            } catch (e: Exception) {
                Log.w(TAG, "Exception in passive authentication", e)
            }
        }

        // private fun doPassiveAuth() {
        //     try {
        //         val digest = MessageDigest.getInstance(sodFile.digestAlgorithm)
        //         val dataHashes = sodFile.dataGroupHashes
        //         val dg14Hash = if (chipAuthSucceeded) digest.digest(dg14Encoded) else ByteArray(0)
        //         val dg1Hash = digest.digest(dg1File.encoded)
        //         val dg2Hash = digest.digest(dg2File.encoded)

        //         if (Arrays.equals(dg1Hash, dataHashes[1]) && Arrays.equals(dg2Hash, dataHashes[2])
        //             && (!chipAuthSucceeded || Arrays.equals(dg14Hash, dataHashes[14]))) {

        //             val asn1InputStream = ASN1InputStream(assets.open("masterList"))
        //             val keystore = KeyStore.getInstance(KeyStore.getDefaultType())
        //             keystore.load(null, null)
        //             val cf = CertificateFactory.getInstance("X.509")

        //             var p: ASN1Primitive?
        //             while (asn1InputStream.readObject().also { p = it } != null) {
        //                 val asn1 = ASN1Sequence.getInstance(p)
        //                 if (asn1 == null || asn1.size() == 0) {
        //                     throw IllegalArgumentException("Null or empty sequence passed.")
        //                 }
        //                 if (asn1.size() != 2) {
        //                     throw IllegalArgumentException("Incorrect sequence size: " + asn1.size())
        //                 }
        //                 val certSet = ASN1Set.getInstance(asn1.getObjectAt(1))
        //                 for (i in 0 until certSet.size()) {
        //                     val certificate = Certificate.getInstance(certSet.getObjectAt(i))
        //                     val pemCertificate = certificate.encoded
        //                     val javaCertificate = cf.generateCertificate(ByteArrayInputStream(pemCertificate))
        //                     keystore.setCertificateEntry(i.toString(), javaCertificate)
        //                 }
        //             }

        //             val docSigningCertificates = sodFile.docSigningCertificates
        //             for (docSigningCertificate: X509Certificate in docSigningCertificates) {
        //                 docSigningCertificate.checkValidity()
        //             }

        //             val cp = cf.generateCertPath(docSigningCertificates)
        //             val pkixParameters = PKIXParameters(keystore)
        //             pkixParameters.isRevocationEnabled = false
        //             val cpv = CertPathValidator.getInstance(CertPathValidator.getDefaultType())
        //             cpv.validate(cp, pkixParameters)
        //             var sodDigestEncryptionAlgorithm = sodFile.docSigningCertificate.sigAlgName
        //             var isSSA = false
        //             if ((sodDigestEncryptionAlgorithm == "SSAwithRSA/PSS")) {
        //                 sodDigestEncryptionAlgorithm = "SHA256withRSA/PSS"
        //                 isSSA = true
        //             }
        //             val sign = Signature.getInstance(sodDigestEncryptionAlgorithm)
        //             if (isSSA) {
        //                 sign.setParameter(PSSParameterSpec("SHA-256", "MGF1", MGF1ParameterSpec.SHA256, 32, 1))
        //             }
        //             sign.initVerify(sodFile.docSigningCertificate)
        //             sign.update(sodFile.eContent)
        //             passiveAuthSuccess = sign.verify(sodFile.encryptedDigest)
        //         }
        //     } catch (e: Exception) {
        //         Log.w(TAG, e)
        //     }
        // }

        override fun onPostExecute(result: Exception?) {
            mainLayout.visibility = View.VISIBLE
            loadingLayout.visibility = View.GONE
            if (result == null) {
                val intent = if (callingActivity != null) {
                    Intent()
                } else {
                    Intent(this@MainActivity, ResultActivity::class.java)
                }
                val mrzInfo = dg1File.mrzInfo
                intent.putExtra(ResultActivity.KEY_FIRST_NAME, mrzInfo.secondaryIdentifier.replace("<", " "))
                intent.putExtra(ResultActivity.KEY_LAST_NAME, mrzInfo.primaryIdentifier.replace("<", " "))
                intent.putExtra(ResultActivity.KEY_GENDER, mrzInfo.gender.toString())
                intent.putExtra(ResultActivity.KEY_STATE, mrzInfo.issuingState)
                intent.putExtra(ResultActivity.KEY_NATIONALITY, mrzInfo.nationality)
                val passiveAuthStr = if (passiveAuthSuccess) {
                    getString(R.string.pass)
                } else {
                    getString(R.string.failed)
                }
                val chipAuthStr = if (chipAuthSucceeded) {
                    getString(R.string.pass)
                } else {
                    getString(R.string.failed)
                }
                intent.putExtra(ResultActivity.KEY_PASSIVE_AUTH, passiveAuthStr)
                intent.putExtra(ResultActivity.KEY_CHIP_AUTH, chipAuthStr)
                bitmap?.let { bitmap ->
                    if (encodePhotoToBase64) {
                        intent.putExtra(ResultActivity.KEY_PHOTO_BASE64, imageBase64)
                    } else {
                        val ratio = 320.0 / bitmap.height
                        val targetHeight = (bitmap.height * ratio).toInt()
                        val targetWidth = (bitmap.width * ratio).toInt()
                        intent.putExtra(
                            ResultActivity.KEY_PHOTO,
                            Bitmap.createScaledBitmap(bitmap, targetWidth, targetHeight, false)
                        )
                    }
                }
                if (callingActivity != null) {
                    setResult(RESULT_OK, intent)
                    finish()
                } else {
                    startActivity(intent)
                }
            } else {
                Snackbar.make(passportNumberView, result.toString(), Snackbar.LENGTH_LONG).show()
            }
        }
    }

    private fun convertDate(input: String?): String? {
        if (input == null) {
            return null
        }
        return try {
            SimpleDateFormat("yyMMdd", Locale.US).format(SimpleDateFormat("yyyy-MM-dd", Locale.US).parse(input)!!)
        } catch (e: ParseException) {
            Log.w(MainActivity::class.java.simpleName, e)
            null
        }
    }

    private fun loadDate(editText: EditText): Calendar {
        val calendar = Calendar.getInstance()
        if (editText.text.isNotEmpty()) {
            try {
                calendar.timeInMillis = SimpleDateFormat("yyyy-MM-dd", Locale.US).parse(editText.text.toString())!!.time
            } catch (e: ParseException) {
                Log.w(MainActivity::class.java.simpleName, e)
            }
        }
        return calendar
    }

    private fun saveDate(editText: EditText, year: Int, monthOfYear: Int, dayOfMonth: Int, preferenceKey: String) {
        val value = String.format(Locale.US, "%d-%02d-%02d", year, monthOfYear + 1, dayOfMonth)
        PreferenceManager.getDefaultSharedPreferences(this)
            .edit().putString(preferenceKey, value).apply()
        editText.setText(value)
    }

    companion object {
        private val TAG = MainActivity::class.java.simpleName
        private const val KEY_PASSPORT_NUMBER = "passportNumber"
        private const val KEY_EXPIRATION_DATE = "expirationDate"
        private const val KEY_BIRTH_DATE = "birthDate"
    }
}




// 1. I'm using java.security.Signature in Kotlin.

// 2. Here is some console logs I did :
//     Log.d(TAG, "sodFile.docSigningCertificate: ${sodFile.docSigningCertificate}")
//     Log.d(TAG, "publicKey: ${sodFile.docSigningCertificate.publicKey}")

//     Log.d(TAG, "sodFile.eContent: ${gson.toJson(sodFile.eContent)}")
//     Log.d(TAG, "sodFile.eContent: ${gson.toJson(sodFile.eContent.joinToString("") { "%02x".format(it) })}")

//     Log.d(TAG, "sodFile.encryptedDigest: ${gson.toJson(sodFile.encryptedDigest)}")
//     Log.d(TAG, "sodFile.encryptedDigest: ${gson.toJson(sodFile.encryptedDigest.joinToString("") { "%02x".format(it) })}")


// 3. Here are the results, in the same order :
// D/MainActivity: sodFile.docSigningCertificate:   [0]         Version: 3
//              SerialNumber: 1492331056996039607751257662496019529147453
//                  IssuerDN: C=FR,O=Gouv,CN=CSCA-FRANCE
//                Start Date: Tue Nov 05 15:29:07 GMT+01:00 2019
//                Final Date: Tue Feb 05 15:29:07 GMT+01:00 2030
//                 SubjectDN: C=FR,O=Gouv,OU=Document Signer,CN=HSM_DS_2,SERIALNUMBER=201911051429020
//                Public Key: RSA Public Key [81:f8:a9:ad:98:ce:a1:f8:41:b7:41:73:c8:4e:a9:a8:c9:32:c3:a2],[56:66:d1:a4]
//             modulus: df11ba06d7937a059e8ce7916ab0fb0b094a9b9ecf98e97eda6834a23075f2030072a3c7868f85045af2acb5f5c2bedf6c25614d99232b98bb456e5f8ce32148882f2281537ac7aa80e4cdb79e0cdf4627cd08da32ce263ef54a26c2ca3493f1d02d9fabcd89952058cb0085fa356b13f9e2cc1e9ca4f47678dc49129d55531bd2817dd436d5aef778d4d439d2d659b0cf9d58eeff43ce2cff26d5c66d23164123fc9c3e6cd4902e9d7b54d9509b03f95debfc3fb15ef7b458ac64a2c6e26bf010451eff67ed87f6ca7a946dd7ac86dea2566cbdc9aa0e3cbaad9f5ed4b6886cd08f6baf1487b58f6ba33075968396c216ef65b0eb49c6978464dcde99f9a9a1
//     public exponent: 10001
    
//       Signature Algorithm: SHA256WITHRSA

// D/MainActivity: publicKey: RSA Public Key [81:f8:a9:ad:98:ce:a1:f8:41:b7:41:73:c8:4e:a9:a8:c9:32:c3:a2],[56:66:d1:a4]
//             modulus: df11ba06d7937a059e8ce7916ab0fb0b094a9b9ecf98e97eda6834a23075f2030072a3c7868f85045af2acb5f5c2bedf6c25614d99232b98bb456e5f8ce32148882f2281537ac7aa80e4cdb79e0cdf4627cd08da32ce263ef54a26c2ca3493f1d02d9fabcd89952058cb0085fa356b13f9e2cc1e9ca4f47678dc49129d55531bd2817dd436d5aef778d4d439d2d659b0cf9d58eeff43ce2cff26d5c66d23164123fc9c3e6cd4902e9d7b54d9509b03f95debfc3fb15ef7b458ac64a2c6e26bf010451eff67ed87f6ca7a946dd7ac86dea2566cbdc9aa0e3cbaad9f5ed4b6886cd08f6baf1487b58f6ba33075968396c216ef65b0eb49c6978464dcde99f9a9a1
//     public exponent: 10001

// D/MainActivity: sodFile.eContent: [49,102,48,21,6,9,42,-122,72,-122,-9,13,1,9,3,49,8,6,6,103,-127,8,1,1,1,48,28,6,9,42,-122,72,-122,-9,13,1,9,5,49,15,23,13,49,57,49,50,49,54,49,55,50,50,51,56,90,48,47,6,9,42,-122,72,-122,-9,13,1,9,4,49,34,4,32,-80,96,59,-43,-125,82,89,-8,105,125,37,-79,-98,-94,-119,43,13,39,115,6,59,-27,81,110,49,75,-1,-72,-101,73,116,86]
// D/MainActivity: sodFile.eContent: "3166301506092a864886f70d01090331080606678108010101301c06092a864886f70d010905310f170d3139313231363137323233385a302f06092a864886f70d01090431220420b0603bd5835259f8697d25b19ea2892b0d2773063be5516e314bffb89b497456"

// D/MainActivity: sodFile.encryptedDigest: [90,120,-59,-46,65,70,49,54,-14,98,85,-53,117,-2,45,-30,-37,-82,-38,16,-17,124,126,-22,47,107,99,89,64,-32,121,-80,77,107,-2,-59,-110,-17,18,-109,54,96,118,56,46,42,-107,67,-67,-124,-87,115,-58,110,108,7,21,-28,104,115,-116,93,-128,44,-104,-51,-127,-86,61,51,-118,78,51,-114,-109,-30,25,65,40,53,69,108,74,2,8,88,124,54,10,91,-115,76,45,9,-48,105,103,30,65,117,16,76,105,-56,-83,45,-83,-58,-34,-92,7,41,70,61,-40,84,51,-110,66,4,6,-64,-118,2,13,-83,-53,20,-20,120,-6,-39,92,-50,-16,-53,-32,106,84,22,-60,90,-102,-68,49,-61,-115,-120,25,12,-74,80,-90,83,111,3,87,-69,106,4,-59,-104,23,-88,-119,-46,-18,-28,18,-117,119,87,-78,-9,-75,46,87,43,3,14,-9,-77,98,-37,-83,32,-34,58,42,44,72,-127,52,4,47,-72,-79,-118,37,77,35,50,-51,-28,-103,110,118,-115,-93,120,99,65,-102,39,96,-71,-13,-108,-34,57,84,37,-37,91,-126,118,-94,75,96,-16,42,11,89,91,-8,26,40,-36,59,-41,88,72,99,100,26,117,80,75,13,-14,103,70,125,-24,117,22]
// D/MainActivity: sodFile.encryptedDigest: "5a78c5d241463136f26255cb75fe2de2dbaeda10ef7c7eea2f6b635940e079b04d6bfec592ef1293366076382e2a9543bd84a973c66e6c0715e468738c5d802c98cd81aa3d338a4e338e93e219412835456c4a0208587c360a5b8d4c2d09d069671e4175104c69c8ad2dadc6dea40729463dd8543392420406c08a020dadcb14ec78fad95ccef0cbe06a5416c45a9abc31c38d88190cb650a6536f0357bb6a04c59817a889d2eee4128b7757b2f7b52e572b030ef7b362dbad20de3a2a2c488134042fb8b18a254d2332cde4996e768da37863419a2760b9f394de395425db5b8276a24b60f02a0b595bf81a28dc3bd7584863641a75504b0df267467de87516"

// 4. Here is the verification of the signature :
//     sodDigestEncryptionAlgorithm = "SHA256withRSA/PSS"
//     val sign = Signature.getInstance(sodDigestEncryptionAlgorithm)
//     if (isSSA) {
//         sign.setParameter(PSSParameterSpec("SHA-256", "MGF1", MGF1ParameterSpec.SHA256, 32, 1))
//     }
//     sign.initVerify(sodFile.docSigningCertificate)
//     sign.update(sodFile.eContent)

//     passiveAuthSuccess = sign.verify(sodFile.encryptedDigest)
//     Log.d(TAG, "Passive authentication success: $passiveAuthSuccess")



// I want the same in python. I want to verify the signatures in Python. Write a script that does this. You can ask me more questions if you need information I did not give you.
