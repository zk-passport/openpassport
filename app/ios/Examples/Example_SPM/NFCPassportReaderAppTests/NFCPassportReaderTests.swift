import XCTest
import CoreNFC
import OpenSSL

@testable import NFCPassportReader

public func XCTAssertNoThrow<T>(_ expression: @autoclosure () throws -> T, _ message: String = "", file: StaticString = #file, line: UInt = #line, also validateResult: (T) -> Void) {
    func executeAndAssignResult(_ expression: @autoclosure () throws -> T, to: inout T?) rethrows {
        to = try expression()
    }
    var result: T?
    XCTAssertNoThrow(try executeAndAssignResult(expression(), to: &result), message, file: file, line: line)
    if let r = result {
        validateResult(r)
    }
}


final class NFCPassportReaderTests: XCTestCase {

    func testBinToHexRep() {
        let val : [UInt8] = [0x12, 0x24, 0x55, 0x77]
        XCTAssertEqual( binToHexRep(val), "12245577" )
    }
    
    func testHexRepToBin() {
        let val : [UInt8] = [0x12, 0x24, 0x55, 0x77]
        XCTAssertEqual( hexRepToBin("12245577"), val  )
    }
    
    func testAsn1Length() {
        // Test < 127
        XCTAssertNoThrow(try asn1Length([0x32])) { (len, offset) in
            XCTAssertEqual(len, 0x32)
            XCTAssertEqual(offset, 1)
        }
        
        // Test 127
        XCTAssertNoThrow(try asn1Length([0x7f])) { (len, offset) in
            XCTAssertEqual(len, 0x7f)
            XCTAssertEqual(offset, 1)
        }
        
        // Test 128
        XCTAssertNoThrow(try asn1Length([0x81, 0x80])) { (len, offset) in
            XCTAssertEqual(len, 128)
            XCTAssertEqual(offset, 2)
        }
        
        // Test 255
        XCTAssertNoThrow(try asn1Length([0x81, 0xFF])) { (len, offset) in
            XCTAssertEqual(len, 255)
            XCTAssertEqual(offset, 2)
        }
        
        // Test 256
        XCTAssertNoThrow(try asn1Length([0x82, 0x01,0x00])) { (len, offset) in
            XCTAssertEqual(len, 256)
            XCTAssertEqual(offset, 3)
        }
        
        // Test 1000
        XCTAssertNoThrow(try asn1Length([0x82, 0x03, 0xE8])) { (len, offset) in
            XCTAssertEqual(len, 1000)
            XCTAssertEqual(offset, 3)
        }
        
        // Test Max value - 65535
        XCTAssertNoThrow(try asn1Length([0x82, 0xff, 0xff])) { (len, offset) in
            XCTAssertEqual(len, 65535)
            XCTAssertEqual(offset, 3)
        }
        
        // Test Too Big
        XCTAssertThrowsError(try toAsn1Length(65536))
    }
    
    func testToASNLength() {
        // Test < 127
        XCTAssertNoThrow(try toAsn1Length(50)) { data in
            XCTAssertEqual(data.count, 1)
            XCTAssertEqual(data[0], 0x32)
        }
        
        // Test 127
        XCTAssertNoThrow(try toAsn1Length(127)) { data in
            XCTAssertEqual(data.count, 1)
            XCTAssertEqual(data[0], 0x7f)
        }
        
        // Test 128
        XCTAssertNoThrow(try toAsn1Length(128)) { data in
            XCTAssertEqual(data.count, 2)
            XCTAssertEqual(data[0], 0x81)
            XCTAssertEqual(data[1], 0x80)
        }
        
        // Test 255
        XCTAssertNoThrow(try toAsn1Length(255)) { data in
            XCTAssertEqual(data.count, 2)
            XCTAssertEqual(data[0], 0x81)
            XCTAssertEqual(data[1], 0xff)
        }
        
        // Test 256
        XCTAssertNoThrow(try toAsn1Length(256)) { data in
            XCTAssertEqual(data.count, 3)
            XCTAssertEqual(data[0], 0x82)
            XCTAssertEqual(data[1], 0x01)
            XCTAssertEqual(data[2], 0x00)
        }
        
        // Test 1000
        XCTAssertNoThrow(try toAsn1Length(1000)) { data in
            XCTAssertEqual(data.count, 3)
            XCTAssertEqual(data[0], 0x82)
            XCTAssertEqual(data[1], 0x03)
            XCTAssertEqual(data[2], 0xE8)
        }
        
        // Test Max value - 65535
        XCTAssertNoThrow(try toAsn1Length(65535)) { data in
            XCTAssertEqual(data.count, 3)
            XCTAssertEqual(data[0], 0x82)
            XCTAssertEqual(data[1], 0xff)
            XCTAssertEqual(data[2], 0xff)
        }
        
        // Test Too Big
        XCTAssertThrowsError(try toAsn1Length(65536))
    }
    

    func testDES3Encryption() {
        let msg = [UInt8]("maryhadalittlelambaaaaaa".data(using: .utf8)!)
        let iv : [UInt8] = [0, 0, 0, 0, 0, 0, 0, 0]
        let key : [UInt8] = [191, 73, 56, 112, 158, 148, 146, 127, 157, 76, 117, 8, 239, 128, 87, 42]
        let enc = tripleDESEncrypt(key: key, message: msg, iv: iv)
        Log.debug("KEY: \(binToHexRep(key))")
        Log.debug("MSG: \(binToHexRep(msg))")
        Log.debug("ENC: \(binToHexRep(enc))")
        
        XCTAssertEqual( binToHexRep(enc), "4DAF068AB358BC9E8F5E916D3DEDE750D92315370E44D9B3" )
    }
    
    func testDES3Decryption() {
        let enc = hexRepToBin("4DAF068AB358BC9E8F5E916D3DEDE750D92315370E44D9B3")
        let iv : [UInt8] = [0, 0, 0, 0, 0, 0, 0, 0]
        let key : [UInt8] = [191, 73, 56, 112, 158, 148, 146, 127, 157, 76, 117, 8, 239, 128, 87, 42]
        let dec = tripleDESDecrypt(key: key, message: enc, iv: iv)
        Log.debug("KEY: \(binToHexRep(key))")
        Log.debug("ENC: \(binToHexRep(enc))")
        Log.debug("DEC: \(binToHexRep(dec))")
        
        let val = String(data:Data(dec), encoding:.utf8)
        XCTAssertEqual( val, "maryhadalittlelambaaaaaa" )
    }
    
    func testSecureMessagingProtect() {
        
        let KSenc = hexRepToBin("8FDCFE759E40A4DF4575160B3BFB79FB")
        let KSmac = hexRepToBin("2AE92531E55707D9C4CEF8C2D6E5AD70")
        let ssc = hexRepToBin("73061884A0E57AA7")
        
        let sm = SecureMessaging(ksenc: KSenc, ksmac: KSmac, ssc: ssc)
        
        let data : [UInt8] = [0x00, 0xA4, 0x02, 0x0C, 0x02, 0x01, 0x01, 0x00]
        let apdu = NFCISO7816APDU(data:Data(data))!
        let protApdu = try! sm.protect( apdu: apdu )
        
        XCTAssertNotNil(protApdu.data )
        XCTAssertEqual( protApdu.instructionClass, 0x0c )
        XCTAssertEqual( protApdu.instructionCode, 0xA4 )
        XCTAssertEqual( protApdu.p1Parameter, 0x02 )
        XCTAssertEqual( protApdu.p2Parameter, 0x0c )
        
        let hexDataRep = binToHexRep( [UInt8](protApdu.data!))
        XCTAssertEqual( hexDataRep, "870901CC69089F8F1AB4698E08B6334B3ABD5A9E09" )
        XCTAssertEqual( protApdu.expectedResponseLength, 0 )
    }

    func testSecureMessagingUnprotectNoData() {
        
        // Note - same keys as above but SSC incremented by 1 as per spec
        let KSenc = hexRepToBin("8FDCFE759E40A4DF4575160B3BFB79FB")
        let KSmac = hexRepToBin("2AE92531E55707D9C4CEF8C2D6E5AD70")
        let ssc = hexRepToBin("73061884A0E57AA8")
        
        let sm = SecureMessaging(ksenc: KSenc, ksmac: KSmac, ssc: ssc)
        
        let data : [UInt8] = hexRepToBin("990290008E08C61E440E5DD415469000")
        let protRespApdu = ResponseAPDU(data: data, sw1: 0x90, sw2: 0x00)
        
        XCTAssertNoThrow(try sm.unprotect( rapdu: protRespApdu )) { rapdu in
            XCTAssertEqual(binToHexRep(rapdu.data), "")
            XCTAssertEqual( rapdu.sw1, 0x90 )
            XCTAssertEqual( rapdu.sw2, 0x00 )
        }
    }

    func testSecureMessagingUnprotectWithData() {
        
        let KSenc = hexRepToBin("8FDCFE759E40A4DF4575160B3BFB79FB")
        let KSmac = hexRepToBin("2AE92531E55707D9C4CEF8C2D6E5AD70")
        let ssc = hexRepToBin("73061884A0E57AAA")
        
        let sm = SecureMessaging(ksenc: KSenc, ksmac: KSmac, ssc: ssc)
        
        let data : [UInt8] = hexRepToBin("87090156D0EFCC887F8973990290008E08D6B9C0DA21DC965F9000")
        let protRespApdu = ResponseAPDU(data: data, sw1: 0x90, sw2: 0x00)
        
        XCTAssertNoThrow(try sm.unprotect( rapdu: protRespApdu )) { rapdu in
            XCTAssertEqual(binToHexRep(rapdu.data), "615B5F1F")
            XCTAssertEqual( rapdu.sw1, 0x90 )
            XCTAssertEqual( rapdu.sw2, 0x00 )

        }
    }
    
    
        func testConvertECDSAPlainTODer() {
            let sigText = "67e147aac644325792dfa0b1615956dc4ed54e8cd859341571db98003431936e0651e9a3cdbcea3c8accd75a6f6bf07eb6bcf9ad1728e21aa854049e634e6fbf"
            let sig = hexRepToBin(sigText)
            
            let ecsig = ECDSA_SIG_new()
            defer { ECDSA_SIG_free(ecsig) }
            sig.withUnsafeBufferPointer { (unsafeBufPtr) in
                let unsafePointer = unsafeBufPtr.baseAddress!
                let r = BN_bin2bn(unsafePointer, 32, nil)
                let s = BN_bin2bn(unsafePointer + 32, 32, nil)
                ECDSA_SIG_set0(ecsig, r, s)
            }
            
            //print( "Sig - \(ecsig)" )
            
            var derEncodedSignature: UnsafeMutablePointer<UInt8>? = nil
            let derLength = i2d_ECDSA_SIG(ecsig, &derEncodedSignature)

            var derBytes = [UInt8](repeating: 0, count: Int(derLength))
            for b in 0..<Int(derLength) {
                derBytes[b] = derEncodedSignature![b]
            }

            XCTAssertNoThrow(try OpenSSLUtils.ASN1Parse(data: Data(derBytes)), "Successfully parsed" )

        }

    
    static var allTests = [
        ("testBinToHexRep", testBinToHexRep),
        ("testHexRepToBin", testHexRepToBin),
        ("testAsn1Length", testAsn1Length),
        ("testToASNLength", testToASNLength),
        ("testDES3Encryption", testDES3Encryption),
        ("testDES3Decryption", testDES3Decryption),
        ("testSecureMessagingProtect", testSecureMessagingProtect),
        ("testSecureMessagingUnprotectNoData", testSecureMessagingUnprotectNoData),
        ("testSecureMessagingUnprotectWithData", testSecureMessagingUnprotectWithData),
    ]
}
