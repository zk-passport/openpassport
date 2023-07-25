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

package io.tradle.nfc

import android.annotation.SuppressLint
import android.app.PendingIntent
import android.content.Intent
import android.graphics.Bitmap
import android.nfc.NfcAdapter
import android.nfc.Tag
import android.nfc.tech.IsoDep
import android.os.AsyncTask
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.util.Base64
import android.util.Log
import android.widget.EditText

import androidx.appcompat.app.AppCompatActivity
import io.tradle.nfc.ImageUtil.decodeImage
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
import java.security.PublicKey
import java.security.spec.X509EncodedKeySpec
import javax.crypto.Cipher
import java.io.IOException
import java.io.ByteArrayOutputStream

import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody

import com.google.gson.Gson;

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.Arguments
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.bridge.LifecycleEventListener

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

class RNPassportReaderModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext), LifecycleEventListener {
    // private var passportNumberFromIntent = false
    // private var encodePhotoToBase64 = false
    private var scanPromise: Promise? = null
    private var opts: ReadableMap? = null

    data class Data(val id: String, val digest: String, val signature: String, val publicKey: String)

    data class PassportData(
      val dg1File: DG1File,
      val dg2File: DG2File,
      val sodFile: SODFile
    )

    interface DataCallback {
      fun onDataReceived(data: String)
    }
      
    init {
      instance = this
      reactContext.addLifecycleEventListener(this)
    }

    override fun onCatalystInstanceDestroy() {
        reactContext.removeLifecycleEventListener(this)
    }

    override fun getName(): String {
        return "RNPassportReader"
    }

    @ReactMethod
    fun createCalendarEvent(name: String, location: String) {
        Log.d("CalendarModule", "Create event called with name: $name and location: $location")
    }

    fun sendDataToJS(passportData: PassportData) {
      val gson = Gson()

      val dataMap = Arguments.createMap()
      dataMap.putString("passportData", gson.toJson(passportData))
      // Add all the other fields of the YourDataClass object to the map

      reactApplicationContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        .emit("ReadDataTaskCompleted", dataMap)
    }

    @ReactMethod
    fun scan(opts: ReadableMap, promise: Promise) {
        val mNfcAdapter = NfcAdapter.getDefaultAdapter(reactApplicationContext)
        // val mNfcAdapter = NfcAdapter.getDefaultAdapter(this.reactContext)
        if (mNfcAdapter == null) {
            promise.reject("E_NOT_SUPPORTED", "NFC chip reading not supported")
            return
        }

        if (!mNfcAdapter.isEnabled) {
            promise.reject("E_NOT_ENABLED", "NFC chip reading not enabled")
            return
        }

        if (scanPromise != null) {
            promise.reject("E_ONE_REQ_AT_A_TIME", "Already running a scan")
            return
        }

        this.opts = opts
        this.scanPromise = promise
        Log.d("RNPassportReaderModule", "opts set to: " + opts.toString())
    }

    private fun resetState() {
        scanPromise = null
        opts = null
    }

    override fun onHostDestroy() {
        resetState()
    }

    override fun onHostResume() {
        val mNfcAdapter = NfcAdapter.getDefaultAdapter(this.reactContext)
        mNfcAdapter?.let {
            val activity = currentActivity
            activity?.let {
                val intent = Intent(it.applicationContext, it.javaClass)
                intent.flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
                val pendingIntent = PendingIntent.getActivity(it, 0, intent, PendingIntent.FLAG_MUTABLE) // PendingIntent.FLAG_UPDATE_CURRENT
                val filter = arrayOf(arrayOf(IsoDep::class.java.name))
                mNfcAdapter.enableForegroundDispatch(it, pendingIntent, null, filter)
            }
        }
    }

    override fun onHostPause() {
        val mNfcAdapter = NfcAdapter.getDefaultAdapter(this.reactContext)
        mNfcAdapter?.disableForegroundDispatch(currentActivity)
    }

    fun receiveIntent(intent: Intent) {
        Log.d("RNPassportReaderModule", "receiveIntent: " + intent.action)
        if (scanPromise == null) return
        if (NfcAdapter.ACTION_TECH_DISCOVERED == intent.action) {
            val tag: Tag? = intent.extras?.getParcelable(NfcAdapter.EXTRA_TAG)
            if (tag?.techList?.contains("android.nfc.tech.IsoDep") == true) {
                val passportNumber = opts?.getString(PARAM_DOC_NUM)
                val expirationDate = opts?.getString(PARAM_DOE)
                val birthDate = opts?.getString(PARAM_DOB)
                if (!passportNumber.isNullOrEmpty() && !expirationDate.isNullOrEmpty() && !birthDate.isNullOrEmpty()) {
                    val bacKey: BACKeySpec = BACKey(passportNumber, birthDate, expirationDate)
                    ReadTask(IsoDep.get(tag), bacKey).execute()
                }
            }
        }
    }

    
    private fun toBase64(bitmap: Bitmap, quality: Int): String {
      val byteArrayOutputStream = ByteArrayOutputStream()
      bitmap.compress(Bitmap.CompressFormat.JPEG, quality, byteArrayOutputStream)
      val byteArray = byteArrayOutputStream.toByteArray()
      return JPEG_DATA_URI_PREFIX + Base64.encodeToString(byteArray, Base64.NO_WRAP)
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
                // fun concatenateHashes(dataGroupHashes: Map<Int, ByteArray>): ByteArray {
                //     val allHashes = ArrayList<ByteArray>()

                //     // Order the data group hashes by their keys and concatenate them
                //     for (i in dataGroupHashes.keys.sorted()) {
                //         allHashes.add(dataGroupHashes[i]!!)
                //     }

                //     // Combine all the byte arrays into one
                //     val combinedSize = allHashes.sumOf { it.size }
                //     val result = ByteArray(combinedSize)
                //     var pos = 0
                //     for (hash in allHashes) {
                //         hash.copyInto(result, pos)
                //         pos += hash.size
                //     }

                //     return result
                // }



                Log.d(TAG, "============FIRST CONSOLE LOG=============")
                val gson = Gson()

                val dg1In = service.getInputStream(PassportService.EF_DG1)
                dg1File = DG1File(dg1In)
                Log.d(TAG, "dg1File: " + gson.toJson(dg1File)) //


                val dg2In = service.getInputStream(PassportService.EF_DG2)
                dg2File = DG2File(dg2In)
                Log.d(TAG, "dg2In:")
                Log.d(TAG, gson.toJson(dg2In))
                Log.d(TAG, gson.toJson(dg2File))

                val sodIn = service.getInputStream(PassportService.EF_SOD)

                sodFile = SODFile(sodIn)

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


                // var concatenated = concatenateHashes(sodFile.dataGroupHashes)
                // Log.d(TAG, "concatenated: $concatenated")
                // Log.d(TAG, "concatenated: ${gson.toJson(concatenated)}")
                // Log.d(TAG, "concatenated: ${gson.toJson(concatenated.joinToString("") { "%02x".format(it) })}")
                Log.d(TAG, "hexMap: ${gson.toJson(hexMap)}")
                Log.d(TAG, "sodFile.eContent: ${sodFile.eContent}")
                Log.d(TAG, "sodFile.eContent: ${gson.toJson(sodFile.eContent)}")
                Log.d(TAG, "sodFile.eContent: ${gson.toJson(sodFile.eContent.joinToString("") { "%02x".format(it) })}")
                Log.d(TAG, "sodFile.encryptedDigest: ${sodFile.encryptedDigest}")
                Log.d(TAG, "sodFile.encryptedDigest: ${gson.toJson(sodFile.encryptedDigest)}")
                Log.d(TAG, "sodFile.encryptedDigest: ${gson.toJson(sodFile.encryptedDigest.joinToString("") { "%02x".format(it) })}")
                // var id = passportNumberView.text.toString()
                // try {
                //     postData(id, sodFile.eContent.joinToString("") { "%02x".format(it) }, sodFile.encryptedDigest.joinToString("") { "%02x".format(it) }, sodFile.docSigningCertificate.publicKey.toString())
                // } catch (e: IOException) {
                //     e.printStackTrace()
                // }
                Log.d(TAG, "============LET'S VERIFY THE SIGNATURE=============")

                doChipAuth(service)
                doPassiveAuth()

                Log.d(TAG, "============SIGNATURE VERIFIED=============")

                // sendDataToJS(PassportData(dg1File, dg2File, sodFile))

                // Log.d(TAG, "============DATA SENT TO JS=============")

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
                    bitmap = decodeImage(reactContext, faceImageInfo.mimeType, inputStream)
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

                    val asn1InputStream = ASN1InputStream(getReactApplicationContext().assets.open("masterList"))
                    val keystore = KeyStore.getInstance(KeyStore.getDefaultType())
                    keystore.load(null, null)
                    val cf = CertificateFactory.getInstance("X.509")

                    var p: ASN1Primitive?
                    Log.d(TAG, "Reading ASN1 sequence...")
                    var obj = asn1InputStream.readObject()

                    while (obj != null) {
                        p = obj
                        // Your processing code for ASN1Primitive p goes here
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
                        obj = asn1InputStream.readObject()

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

        override fun onPostExecute(result: Exception?) {
          if (scanPromise == null) return

          if (result != null) {
              // Log.w(TAG, exceptionStack(result))
              if (result is IOException) {
                  scanPromise?.reject("E_SCAN_FAILED_DISCONNECT", "Lost connection to chip on card")
              } else {
                  scanPromise?.reject("E_SCAN_FAILED", result)
              }

              resetState()
              return
          }

          val mrzInfo = dg1File.mrzInfo

          var quality = 100
          if (opts?.hasKey("quality") == true) {
              quality = (opts?.getDouble("quality") ?: 1.0 * 100).toInt()
          }
          val gson = Gson()


          val base64 = bitmap?.let { toBase64(it, quality) }
          val photo = Arguments.createMap()
          photo.putString("base64", base64 ?: "")
          photo.putInt("width", bitmap?.width ?: 0)
          photo.putInt("height", bitmap?.height ?: 0)

          val firstName = mrzInfo.secondaryIdentifier.replace("<", "")
          val lastName = mrzInfo.primaryIdentifier.replace("<", "")
          val passport = Arguments.createMap()
          passport.putString("firstName", firstName)
          passport.putString("lastName", lastName)
          passport.putString("nationality", mrzInfo.nationality)
          passport.putString("gender", mrzInfo.gender.toString())
          passport.putString("issuer", mrzInfo.issuingState)
          passport.putMap("photo", photo)
          passport.putString("dg1File", gson.toJson(dg1File))
          passport.putString("publicKey", sodFile.docSigningCertificate.publicKey.toString())
          passport.putString("publicKeyOldSchool", Base64.encodeToString(sodFile.docSigningCertificate.publicKey.encoded, Base64.DEFAULT))
          passport.putString("dataGroupHashes", gson.toJson(sodFile.dataGroupHashes))
          passport.putString("eContent", gson.toJson(sodFile.eContent.joinToString("") { "%02x".format(it) }))
          passport.putString("encryptedDigest", gson.toJson(sodFile.encryptedDigest.joinToString("") { "%02x".format(it) }))

          // Log.d(TAG, "sodFile.docSigningCertificate: ${sodFile.docSigningCertificate}")
          // Log.d(TAG, "publicKey: ${sodFile.docSigningCertificate.publicKey}")
          // Log.d(TAG, "publicKey: ${Base64.encodeToString(sodFile.docSigningCertificate.publicKey.encoded, Base64.DEFAULT)}")
          // Log.d(TAG, "sodFile.dataGroupHashes: ${sodFile.dataGroupHashes}")
          // Log.d(TAG, "sodFile.eContent: ${gson.toJson(sodFile.eContent.joinToString("") { "%02x".format(it) })}")
          // Log.d(TAG, "sodFile.encryptedDigest: ${gson.toJson(sodFile.encryptedDigest.joinToString("") { "%02x".format(it) })}")

          scanPromise?.resolve(passport)
          resetState()
      }
    }

    private fun convertDate(input: String?): String? {
        if (input == null) {
            return null
        }
        return try {
            SimpleDateFormat("yyMMdd", Locale.US).format(SimpleDateFormat("yyyy-MM-dd", Locale.US).parse(input)!!)
        } catch (e: ParseException) {
            // Log.w(RNPassportReaderModule::class.java.simpleName, e)
            null
        }
    }


    companion object {
        private val TAG = RNPassportReaderModule::class.java.simpleName
        private const val PARAM_DOC_NUM = "documentNumber";
        private const val PARAM_DOB = "dateOfBirth";
        private const val PARAM_DOE = "dateOfExpiry";
        const val JPEG_DATA_URI_PREFIX = "data:image/jpeg;base64,"
        private const val KEY_IS_SUPPORTED = "isSupported"
        var instance: RNPassportReaderModule? = null
    }
}