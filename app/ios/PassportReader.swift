
import Foundation
import React
import NFCPassportReader

@available(iOS 15, *)
@objc(PassportReader)
class PassportReader: NSObject{

      private typealias NFCCheckedContinuation = CheckedContinuation<NFCPassportModel, Error>
    private var nfcContinuation: NFCCheckedContinuation?

    private var passport : NFCPassportModel = NFCPassportModel()
    
    private var readerSession: NFCTagReaderSession?
    private var currentlyReadingDataGroup : DataGroupId?
    
    private var dataGroupsToRead : [DataGroupId] = []
    private var readAllDatagroups = false
    private var skipSecureElements = true
    private var skipCA = false
    private var skipPACE = false

    private var bacHandler : BACHandler?
    private var caHandler : ChipAuthenticationHandler?
    private var paceHandler : PACEHandler?
    private var mrzKey : String = ""
    private var dataAmountToReadOverride : Int? = nil
    
    private var scanCompletedHandler: ((NFCPassportModel?, NFCPassportReaderError?)->())!
    private var nfcViewDisplayMessageHandler: ((NFCViewDisplayMessage) -> String?)?
    private var masterListURL : URL?
    private var shouldNotReportNextReaderSessionInvalidationErrorUserCanceled : Bool = false

    // By default, Passive Authentication uses the new RFS5652 method to verify the SOD, but can be switched to use
    // the previous OpenSSL CMS verification if necessary
    public var passiveAuthenticationUsesOpenSSL : Bool = false

    public init( logLevel: LogLevel = .info, masterListURL: URL? = nil ) {
        super.init()
        
        Log.logLevel = logLevel
        self.masterListURL = masterListURL
    }
    
    public func setMasterListURL( _ masterListURL : URL ) {
        self.masterListURL = masterListURL
    }
    
    // This function allows you to override the amount of data the TagReader tries to read from the NFC
    // chip. NOTE - this really shouldn't be used for production but is useful for testing as different
    // passports support different data amounts.
    // It appears that the most reliable is 0xA0 (160 chars) but some will support arbitary reads (0xFF or 256)
    public func overrideNFCDataAmountToRead( amount: Int ) {
        dataAmountToReadOverride = amount
    }

  
  private let passportReader = NFCPassportReader.PassportReader()
  
  func getMRZKey(passportNumber: String, dateOfBirth: String, dateOfExpiry: String ) -> String {
    
    // Pad fields if necessary
    let pptNr = pad( passportNumber, fieldLength:9)
    let dob = pad( dateOfBirth, fieldLength:6)
    let exp = pad( dateOfExpiry, fieldLength:6)
    
    // Calculate checksums
    let passportNrChksum = calcCheckSum(pptNr)
    let dateOfBirthChksum = calcCheckSum(dob)
    let expiryDateChksum = calcCheckSum(exp)
    
    let mrzKey = "\(pptNr)\(passportNrChksum)\(dob)\(dateOfBirthChksum)\(exp)\(expiryDateChksum)"
    
    return mrzKey
  }
  
  func pad( _ value : String, fieldLength:Int ) -> String {
    // Pad out field lengths with < if they are too short
    let paddedValue = (value + String(repeating: "<", count: fieldLength)).prefix(fieldLength)
    return String(paddedValue)
  }
      
  func calcCheckSum( _ checkString : String ) -> Int {
    let characterDict  = ["0" : "0", "1" : "1", "2" : "2", "3" : "3", "4" : "4", "5" : "5", "6" : "6", "7" : "7", "8" : "8", "9" : "9", "<" : "0", " " : "0", "A" : "10", "B" : "11", "C" : "12", "D" : "13", "E" : "14", "F" : "15", "G" : "16", "H" : "17", "I" : "18", "J" : "19", "K" : "20", "L" : "21", "M" : "22", "N" : "23", "O" : "24", "P" : "25", "Q" : "26", "R" : "27", "S" : "28","T" : "29", "U" : "30", "V" : "31", "W" : "32", "X" : "33", "Y" : "34", "Z" : "35"]
    
    var sum = 0
    var m = 0
    let multipliers : [Int] = [7, 3, 1]
    for c in checkString {
      guard let lookup = characterDict["\(c)"],
            let number = Int(lookup) else { return 0 }
      let product = number * multipliers[m]
      sum += product
      m = (m+1) % 3
    }
    
    return (sum % 10)
  }
  
  @objc(scanPassport:dateOfBirth:dateOfExpiry:resolve:reject:)
  func scanPassport(_ passportNumber: String, dateOfBirth: String, dateOfExpiry: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    let customMessageHandler : (NFCViewDisplayMessage)->String? = { (displayMessage) in
                    switch displayMessage {
                        case .requestPresentPassport:
                            return "Hold your iPhone near ann NFC enabled passport."
                        default:
                            // Return nil for all other messages so we use the provided default
                            return nil
                    }
                }

    Task { [weak self] in
            guard let self = self else {
              return
            }

            do {
                let mrzKey = getMRZKey( passportNumber: passportNumber, dateOfBirth: dateOfBirth, dateOfExpiry: dateOfExpiry)
                let masterListURL = Bundle.main.url(forResource: "masterList", withExtension: ".pem")
              passportReader.setMasterListURL( masterListURL! )

                let passport = try await passportReader.readPassport( mrzKey: mrzKey, customDisplayMessage: customMessageHandler)

              let passportData = passport.lastName
                resolve(passportData)
            } catch {
                reject("E_PASSPORT_READ", "Failed to read passport", error)
            }
        }
  }
  
 @objc(scanPassport:dateOfBirth:dateOfExpiry:resolve:reject:)
 func scanPassport(_ passportNumber: String, dateOfBirth: String, dateOfExpiry: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
   let concatenatedString = "\(passportNumber), \(dateOfBirth), \(dateOfExpiry)"
   resolve(concatenatedString)
 }

  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return true
  }



    public func tagReaderSession(_ session: NFCTagReaderSession, didDetect tags: [NFCTag]) {
        Log.debug( "tagReaderSession:didDetect - \(tags[0])" )
        if tags.count > 1 {
            Log.debug( "tagReaderSession:more than 1 tag detected! - \(tags)" )

            let errorMessage = NFCViewDisplayMessage.error(.MoreThanOneTagFound)
            self.invalidateSession(errorMessage: errorMessage, error: NFCPassportReaderError.MoreThanOneTagFound)
            return
        }

        let tag = tags.first!
        var passportTag: NFCISO7816Tag
        switch tags.first! {
        case let .iso7816(tag):
            passportTag = tag
        default:
            Log.debug( "tagReaderSession:invalid tag detected!!!" )

            let errorMessage = NFCViewDisplayMessage.error(NFCPassportReaderError.TagNotValid)
            self.invalidateSession(errorMessage:errorMessage, error: NFCPassportReaderError.TagNotValid)
            return
        }
        
        Task { [passportTag] in
            do {
                try await session.connect(to: tag)
                
                Log.debug( "tagReaderSession:connected to tag - starting authentication" )
                self.updateReaderSessionMessage( alertMessage: NFCViewDisplayMessage.authenticatingWithPassport(0) )
                
                let tagReader = TagReader(tag:passportTag)
                
                if let newAmount = self.dataAmountToReadOverride {
                    tagReader.overrideDataAmountToRead(newAmount: newAmount)
                }
                
                tagReader.progress = { [unowned self] (progress) in
                    if let dgId = self.currentlyReadingDataGroup {
                        self.updateReaderSessionMessage( alertMessage: NFCViewDisplayMessage.readingDataGroupProgress(dgId, progress) )
                    } else {
                        self.updateReaderSessionMessage( alertMessage: NFCViewDisplayMessage.authenticatingWithPassport(progress) )
                    }
                }
                
                let passportModel = try await self.startReading( tagReader : tagReader)
                nfcContinuation?.resume(returning: passportModel)
                nfcContinuation = nil

                
            } catch let error as NFCPassportReaderError {
                let errorMessage = NFCViewDisplayMessage.error(error)
                self.invalidateSession(errorMessage: errorMessage, error: error)
            } catch let error {

                nfcContinuation?.resume(throwing: error)
                nfcContinuation = nil
                Log.debug( "tagReaderSession:failed to connect to tag - \(error.localizedDescription)" )
                let errorMessage = NFCViewDisplayMessage.error(NFCPassportReaderError.ConnectionError)
                self.invalidateSession(errorMessage: errorMessage, error: NFCPassportReaderError.ConnectionError)
            }
        }
    }
    
    func updateReaderSessionMessage(alertMessage: NFCViewDisplayMessage ) {
        self.readerSession?.alertMessage = self.nfcViewDisplayMessageHandler?(alertMessage) ?? alertMessage.description
    }
}

@available(iOS 15, *)
extension PassportReader {
    
    func startReading(tagReader : TagReader) async throws -> NFCPassportModel {

        if !skipPACE {
            do {
                let data = try await tagReader.readCardAccess()
                Log.verbose( "Read CardAccess - data \(binToHexRep(data))" )
                let cardAccess = try CardAccess(data)
                passport.cardAccess = cardAccess
     
                Log.info( "Starting Password Authenticated Connection Establishment (PACE)" )
                 
                let paceHandler = try PACEHandler( cardAccess: cardAccess, tagReader: tagReader )
                try await paceHandler.doPACE(mrzKey: mrzKey )
                passport.PACEStatus = .success
                Log.debug( "PACE Succeeded" )
            } catch {
                passport.PACEStatus = .failed
                Log.error( "PACE Failed - falling back to BAC" )
            }
            
            _ = try await tagReader.selectPassportApplication()
        }
        
        // If either PACE isn't supported, we failed whilst doing PACE or we didn't even attempt it, then fall back to BAC
        if passport.PACEStatus != .success {
            try await doBACAuthentication(tagReader : tagReader)
        }
        
        // Now to read the datagroups
        try await readDataGroups(tagReader: tagReader)
        
        self.updateReaderSessionMessage(alertMessage: NFCViewDisplayMessage.successfulRead)

        try await doActiveAuthenticationIfNeccessary(tagReader : tagReader)
        self.shouldNotReportNextReaderSessionInvalidationErrorUserCanceled = true
        self.readerSession?.invalidate()

        // If we have a masterlist url set then use that and verify the passport now
        self.passport.verifyPassport(masterListURL: self.masterListURL, useCMSVerification: self.passiveAuthenticationUsesOpenSSL)

        return self.passport
    }
    


    func doBACAuthentication(tagReader : TagReader) async throws {
        self.currentlyReadingDataGroup = nil
        
        Log.info( "Starting Basic Access Control (BAC)" )
        
        self.passport.BACStatus = .failed

        self.bacHandler = BACHandler( tagReader: tagReader )
        try await bacHandler?.performBACAndGetSessionKeys( mrzKey: mrzKey )
        Log.info( "Basic Access Control (BAC) - SUCCESS!" )

        self.passport.BACStatus = .success
    }

    func readDataGroups( tagReader: TagReader ) async throws {
        
        // Read COM
        var DGsToRead = [DataGroupId]()

        self.updateReaderSessionMessage( alertMessage: NFCViewDisplayMessage.readingDataGroupProgress(.COM, 0) )
        if let com = try await readDataGroup(tagReader:tagReader, dgId:.COM) as? COM {
            self.passport.addDataGroup( .COM, dataGroup:com )
        
            // SOD and COM shouldn't be present in the DG list but just in case (worst case here we read the sod twice)
            DGsToRead = [.SOD] + com.dataGroupsPresent.map { DataGroupId.getIDFromName(name:$0) }
            DGsToRead.removeAll { $0 == .COM }
        }
        
        if DGsToRead.contains( .DG14 ) {
            DGsToRead.removeAll { $0 == .DG14 }
            
            if !skipCA {
                // Do Chip Authentication
                if let dg14 = try await readDataGroup(tagReader:tagReader, dgId:.DG14) as? DataGroup14 {
                    self.passport.addDataGroup( .DG14, dataGroup:dg14 )
                    let caHandler = ChipAuthenticationHandler(dg14: dg14, tagReader: tagReader)
                     
                    if caHandler.isChipAuthenticationSupported {
                        do {
                            // Do Chip authentication and then continue reading datagroups
                            try await caHandler.doChipAuthentication()
                            self.passport.chipAuthenticationStatus = .success
                        } catch {
                            Log.info( "Chip Authentication failed - re-establishing BAC")
                            self.passport.chipAuthenticationStatus = .failed
                            
                            // Failed Chip Auth, need to re-establish BAC
                            try await doBACAuthentication(tagReader: tagReader)
                        }
                    }
                }
            }
        }

        // If we are skipping secure elements then remove .DG3 and .DG4
        if self.skipSecureElements {
            DGsToRead = DGsToRead.filter { $0 != .DG3 && $0 != .DG4 }
        }

        if self.readAllDatagroups != true {
            DGsToRead = DGsToRead.filter { dataGroupsToRead.contains($0) }
        }
        for dgId in DGsToRead {
            self.updateReaderSessionMessage( alertMessage: NFCViewDisplayMessage.readingDataGroupProgress(dgId, 0) )
            if let dg = try await readDataGroup(tagReader:tagReader, dgId:dgId) {
                self.passport.addDataGroup( dgId, dataGroup:dg )
            }
        }
    }

}
