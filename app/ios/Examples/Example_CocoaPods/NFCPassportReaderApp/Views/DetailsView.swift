//
//  DetailsView.swift
//  NFCPassportReaderApp
//
//  Created by Andy Qua on 30/10/2019.
//  Copyright © 2019 Andy Qua. All rights reserved.
//

import SwiftUI
import NFCPassportReader

struct Item : Identifiable {
    var id = UUID()
    var title : String
    var value : String
    
    var textColor : Color {
        return value.hasPrefix("FAILED") ? Color.red : Color.primary
    }
}


struct DetailsView : View {    
    private var passport: NFCPassportModel
    private var sectionNames = ["Chip information", "Verification information", "Document signing certificate", "Country signing certificate", "Security Info details", "Datagroup Hashes"]
    private var sections = [[Item]]()

    init( passport : NFCPassportModel ) {
        self.passport = passport
        sections.append(getChipInfoSection(self.passport))
        sections.append(getVerificationDetailsSection(self.passport))
        sections.append(getCertificateSigningCertDetails(certItems:self.passport.documentSigningCertificate?.getItemsAsDict()))
        sections.append(getCertificateSigningCertDetails(certItems:self.passport.countrySigningCertificate?.getItemsAsDict()))
        sections.append(getSecurityInfosSection(self.passport))
        sections.append(getDataGroupHashesSection(self.passport))
    }
    
    var body: some View {
        VStack {
            List {
                ForEach( 0 ..< self.sectionNames.count ) { i in
                    if self.sections[i].count > 0 {
                        SectionGroup(sectionTitle: self.sectionNames[i], items: self.sections[i])
                    }
                }
            }
        }
    }
    
    func getChipInfoSection(_ passport: NFCPassportModel) -> [Item] {
        // Build Chip info section
        let chipInfo = [Item(title:"LDS Version", value: passport.LDSVersion),
                        Item(title:"Data groups present", value: passport.dataGroupsPresent.joined(separator: ", ")),
                        Item(title:"Data groups read", value: passport.dataGroupsAvailable.map { $0.getName()}.joined(separator: ", "))]

        return chipInfo
    }
    
    func getVerificationDetailsSection(_ passport: NFCPassportModel) -> [Item] {
        // Build Verification Info section
        var activeAuth : String = "Not supported"
        if passport.activeAuthenticationSupported {
            activeAuth = passport.activeAuthenticationPassed ? "SUCCESS\nSignature verified" : "FAILED\nCould not verify signature"
        }
        var chipAuth : String = "Not supported"
        if passport.isChipAuthenticationSupported {
            switch( passport.chipAuthenticationStatus ) {
                case .notDone:
                    chipAuth = "Supported - Not done"
                case .success:
                    chipAuth = "SUCCESS\nSignature verified"
                case .failed:
                    chipAuth = "FAILED\nCould not verify signature"
            }
        }
        
        var authType : String = "Authentication not done"
        if passport.PACEStatus == .success {
            authType = "PACE"
        } else if passport.BACStatus == .success {
            authType = "BAC"
        }
        
        // Do PACE Info
        var paceStatus = "Not Supported"
        if passport.isPACESupported {
            switch( passport.PACEStatus ) {
                case .notDone:
                    paceStatus = "Supported - Not done"
                case .success:
                    paceStatus = "SUCCESS"
                case .failed:
                    paceStatus = "FAILED"
            }
        }

        let verificationDetails : [Item] = [
            Item(title: "Access Control", value: authType),
            Item(title: "PACE", value: paceStatus),
            Item(title: "Chip Authentication", value: chipAuth),
            Item(title: "Active Authentication", value: activeAuth),
            Item(title: "Document Signing Certificate", value: passport.documentSigningCertificateVerified ? "SUCCESS\nSOD Signature verified" : "FAILED\nCouldn't verify SOD signature"),
            Item(title: "Country signing Certificate", value: passport.passportCorrectlySigned ? "SUCCESS\nmatched to country signing certificate" : "FAILED\nCouldn't build trust chain"),
            Item(title: "Data group hashes", value: passport.passportDataNotTampered ? "SUCCESS\nAll hashes match" : "FAILED\nCouldn't match hashes" )
        ]

        return verificationDetails
    }
    
    func getCertificateSigningCertDetails( certItems : [CertificateItem : String]? ) -> [Item] {
        let titles : [String] = ["Serial number", "Signature algorithm", "Public key algorithm", "Certificate fingerprint", "Issuer", "Subject", "Valid from", "Valid to"]

        var items = [Item]()
        if certItems?.count ?? 0  == 0 {
            items.append( Item(title:"Certificate details", value: "NOT FOUND" ) )
        } else {
            for title in titles {
                let ci = CertificateItem(rawValue:title)!
                items.append( Item(title:title, value: certItems?[ci] ?? "") )
            }
        }
        return items
    }

    func getDataGroupHashesSection(_ passport: NFCPassportModel) -> [Item] {
        var dgHashes = [Item]()
        for id in DataGroupId.allCases {
            if let hash = passport.dataGroupHashes[id] {
                dgHashes.append( Item(title:hash.id, value:hash.match ? "MATCHED" : "UNMATCHED"))
                dgHashes.append( Item(title:"SOD Hash", value: hash.sodHash))
                dgHashes.append( Item(title:"Computed Hash", value: hash.computedHash))
            }
        }
        return dgHashes
    }

    func getSecurityInfosSection( _ passport : NFCPassportModel) -> [Item] {
        guard let dg14 = passport.getDataGroup(.DG14) as? DataGroup14 else { return [] }
        
        var items = [Item]()
        for secInfo in dg14.securityInfos {
            var title : String = ""
            var value : String = ""
            if let cai = secInfo as? ChipAuthenticationInfo {
                title = "ChipAuthenticationInfo"
                value = "\(secInfo.getProtocolOIDString())\n\(secInfo.getObjectIdentifier())\nUses Key Id: \(cai.getKeyId())"
            } else if let capki = secInfo as? ChipAuthenticationPublicKeyInfo {
                title = "ChipAuthenticationPublicKeyInfo"
                value = "\(secInfo.getProtocolOIDString())\n\(secInfo.getObjectIdentifier())\nKey Id: \(capki.getKeyId())"
            } else if let pacei = secInfo as? PACEInfo {
                title = "PACEInfo"
                value = "\(pacei.getProtocolOIDString())\n\(pacei.getObjectIdentifier())\nParameter ID: \(pacei.getParameterId() ?? -1)"
            } else if let activeAuthInfo = secInfo as? ActiveAuthenticationInfo {
                title = "ActiveAuthenticationInfo"
                value =
                    "\(activeAuthInfo.getProtocolOIDString())\n\(activeAuthInfo.getSignatureAlgorithmOIDString() ?? "")"
            }

            items.append( Item(title:title, value: value))

        }
        return items
    }
}

struct SectionGroup : View {
    var sectionTitle : String
    var items : [Item]
    
    var body: some View {
        Section(header: Text(sectionTitle)) {
            ForEach(self.items) { item in
                VStack(alignment:.leading, spacing:0) {
                    Text(item.title)
                        .font(.headline)
                    Text(item.value)
                        .foregroundColor(item.textColor)
                        .lineLimit(nil)
                }
            }
        }
    }
}


struct DetailsView_Previews: PreviewProvider {

    static var previews: some View {
        let settings = SettingsStore()
        let passport = NFCPassportModel()
        return DetailsView(passport:passport)
            .environmentObject(settings)
            .environment( \.colorScheme, .light)
    }
}


