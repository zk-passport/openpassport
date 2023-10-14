//
//  DataGroupParsingTests.swift
//  
//
//  Created by Andy Qua on 15/06/2019.
//

import Foundation
import XCTest
import OpenSSL

@testable import NFCPassportReader


final class DataGroupParsingTests: XCTestCase {
    func testDatagroup1Parsing() {
        
        // Random generated test MRZ
        let mrz = "P<GBRTHATCHER<<BOB<<<<<<<<<<<<<<<<<<<<<<<<<<7125143269GBR3906022M1601013<<<<<<<<<<<<<<08"
        let mrzBin = [UInt8](mrz.data(using: .utf8)!)
        let tag = try! [0x5F,0x1F] +  toAsn1Length(mrzBin.count) + mrzBin
        let dg1 = try! [0x61] + toAsn1Length(tag.count) + tag
        
        let dgp = DataGroupParser()
        XCTAssertNoThrow(try dgp.parseDG(data: dg1)) { dg in
            XCTAssertNotNil(dg)
            XCTAssertTrue( dg is DataGroup1 )
        }
    }
    
    func testDatagroup2ParsingJPEG2000() {
        
        // This is a cut down version of the DG2 record. It contains everything up to the end of the image header - no actuall image data as its way too big to include here
        // I've also adjusted the record lengths accordingly
        
        let dg2 = hexRepToBin("75617F61570201017F6082203FA1128002010081010282010087020101880200085F2E38464143003031300000002026000100002018000000000000000000010000000000000001000000000000000000000000000C6A5020200D0A")
        
        let dgp = DataGroupParser()
        XCTAssertNoThrow(try dgp.parseDG(data: dg2)) { dg in
            XCTAssertNotNil(dg)
            XCTAssertTrue( dg is DataGroup2 )
        }
        
    }
    
    func testDatagroup2ParsingJPEG() {
        
        // This is a cut down version of the DG2 record. It contains everything up to the begininnig of what would be the image data - no actual image data as its way too big to include here
        // I've also adjusted the record lengths accordingly
        
        let dg2 = hexRepToBin("75617F618220470201017F6082203FA1128002010081010282010087020101880200085F2E3846414300303130000000202600010000201800000000000000000001000000000000000100000000000000000000FFD8FFE000104A464946")
        let dgp = DataGroupParser()
        XCTAssertNoThrow(try dgp.parseDG(data: dg2)) { dg in
            XCTAssertNotNil(dg)
            XCTAssertTrue( dg is DataGroup2 )
        }
    }
    
    func testDatagroup7ParsingJPEG() {
        
        // This is a cut down version of the DG7 record. It contains everything up to the end of the image header - no actuall image data as its way too big to include here
        // I've also adjusted the record lengths accordingly
        
        let dg7 = hexRepToBin("678220060201015F4300")
        let dgp = DataGroupParser()
        XCTAssertNoThrow(try dgp.parseDG(data: dg7)) { dg in
            XCTAssertNotNil(dg)
            XCTAssertTrue( dg is DataGroup7 )
        }
    }

    func testDatagroup11Parsing() {
        
        // This is a cut down version of the DG7 record. It contains everything up to the end of the image header - no actuall image data as its way too big to include here
        // I've also adjusted the record lengths accordingly
        
        let dg11Val = hexRepToBin("6B305C065F0E5F2B5F115F0E0C546573743C3C5465737465725F2B0831393730313230315F110B4E6F727468616D70746F6E")
        let dgp = DataGroupParser()
        
        XCTAssertNoThrow(try dgp.parseDG(data: dg11Val)) { dg in
            XCTAssertNotNil(dg)
            XCTAssertTrue( dg is DataGroup11 )

            let dg11 = dg as! DataGroup11
            XCTAssertEqual(dg11.fullName, "Test<<Tester")
            XCTAssertEqual(dg11.dateOfBirth, "19701201")
            XCTAssertEqual(dg11.placeOfBirth, "Northampton")
        }
    }

    func testDatagroup12Parsing() {
        
        // This is a cut down version of the DG7 record. It contains everything up to the end of the image header - no actuall image data as its way too big to include here
        // I've also adjusted the record lengths accordingly
        
        let dg12Val = hexRepToBin("6C1A5C045F265F195F260832303138303332365F1906544553544552")
        let dgp = DataGroupParser()
        
        XCTAssertNoThrow(try dgp.parseDG(data: dg12Val)) { dg in
            XCTAssertNotNil(dg)
            XCTAssertTrue( dg is DataGroup12 )

            let dg12 = dg as! DataGroup12
            XCTAssertEqual(dg12.issuingAuthority, "TESTER")
            XCTAssertEqual(dg12.dateOfIssue, "20180326")
        }
    }

    func testDatagroup15Parsing() {
        
        // This is a cut down version of the DG7 record. It contains everything up to the end of the image header - no actuall image data as its way too big to include here
        // I've also adjusted the record lengths accordingly
        
        let dg15Val = hexRepToBin("6F820137308201333081EC06072A8648CE3D02013081E0020101302C06072A8648CE3D0101022100A9FB57DBA1EEA9BC3E660A909D838D726E3BF623D52620282013481D1F6E5377304404207D5A0975FC2C3057EEF67530417AFFE7FB8055C126DC5C6CE94A4B44F330B5D9042026DC5C6CE94A4B44F330B5D9BBD77CBF958416295CF7E1CE6BCCDC18FF8C07B60441048BD2AEB9CB7E57CB2C4B482FFC81B7AFB9DE27E1E3BD23C23A4453BD9ACE3262547EF835C3DAC4FD97F8461A14611DC9C27745132DED8E545C1D54C72F046997022100A9FB57DBA1EEA9BC3E660A909D838D718C397AA3B561A6F7901E0E82974856A7020101034200049BD24313046EB43CC4652B6FC1AA00E76B5405F4E7016521E95BE53B9C5BAE5A1410F12CF3AE23F886EFCEDE89F7C63AD9CA9E5C6C05DE902DB70F2EB2341F9D")
        let dgp = DataGroupParser()
        
        XCTAssertNoThrow(try dgp.parseDG(data: dg15Val)) { dg in
            XCTAssertNotNil(dg)
            XCTAssertTrue( dg is DataGroup15 )

            let dg15 = dg as? DataGroup15
            XCTAssertTrue( dg15?.ecdsaPublicKey != nil || dg15?.rsaPublicKey != nil )
        }
    }


    func testCOMDatagroupParsing() {
        let com = hexRepToBin("601A5F0104303130375F36063034303030305C08617563676B6C6E6F")
        let dgp = DataGroupParser()
        XCTAssertNoThrow(try dgp.parseDG(data: com)) { dg in
            XCTAssertNotNil(dg)
            XCTAssertTrue( dg is COM )
            guard let com = dg as? COM else { XCTFail(); return }
            
            // Version should be 0x30313037 or [0x30, 0x31, 0x30, 0x37]
            XCTAssertEqual( com.version, "1.7")
            
            // Unicode version should be 0x303430303030 or [0x30, 0x34, 0x30, 0x30, 0x30, 0x30]
            XCTAssertEqual( com.unicodeVersion, "4.0.0")
            
            // Datagroups present are COM, DG1, DG2, DG3, DG7, DG11, DG12, DG14, DG15
            XCTAssertEqual( com.dataGroupsPresent,["DG1", "DG2", "DG3", "DG7", "DG11", "DG12", "DG14", "DG15"])

        }
    }
    
    static var allTests = [
        ("testDatagroup1Parsing", testDatagroup1Parsing),
        ("testDatagroup2Parsing", testDatagroup2ParsingJPEG2000),
        ("testDatagroup2ParsingJPEG", testDatagroup2ParsingJPEG),
        ("testCOMDatagroupParsing", testCOMDatagroupParsing),
    ]
    
}
