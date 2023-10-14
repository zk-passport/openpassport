//
//  PassportSummaryView.swift
//  NFCPassportReaderApp
//
//  Created by Andy Qua on 17/02/2021.
//  Copyright © 2021 Andy Qua. All rights reserved.
//

import SwiftUI
import NFCPassportReader

struct PassportSummaryView: View {
    @EnvironmentObject var settings: SettingsStore
    
    @State var passport: NFCPassportModel
    
    var body: some View {
        VStack {
            PassportDetailsView(passport: passport)
                .background( Color.primary.colorInvert() )
                .cornerRadius(10)
                .shadow(radius: 20)
                .overlay(
                    RoundedRectangle(cornerRadius: 10)
                        .stroke(Color.primary, lineWidth: 2)
                )
                .padding()
        }
        
    }
}


// Shows the Pzssport details
struct PassportDetailsView : View {
    var passport: NFCPassportModel
    
    var body: some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading) {
                Image(uiImage:passport.passportImage ?? UIImage(named:"head")!)
                    .resizable()
                    .renderingMode(.original)
                    .aspectRatio(contentMode: .fit)
                    .frame(width: 120, height: 180)
                    .padding([.leading], 10.0)
            }
            VStack {
                HStack {
                    Text( passport.documentType)
                    Text( passport.issuingAuthority)
                    Text( passport.documentNumber)
                    Spacer()
                }
                HStack {
                    VStack(alignment: .leading) {
                        Text( passport.lastName)
                        Text( passport.firstName)
                        Text( passport.nationality)
                        Text( passport.dateOfBirth)
                        Text( passport.gender)
                        Text( passport.documentExpiryDate )
                    }
                    Spacer()
                    VStack {
                        if !passport.passportDataNotTampered {
                            Image( systemName:"exclamationmark").foregroundColor(.red)
                                .font(.system(size: 20))
                            Text( "Tampered")
                                .font(.caption)
                                .foregroundColor(.red)
                                .padding(.bottom)
                        }
                        if passport.passportCorrectlySigned && passport.documentSigningCertificateVerified {
                            Image( systemName:"checkmark.seal").foregroundColor(.green)
                                .font(.system(size: 25))
                            Text( "Genuine")
                                .font(.caption)
                                .foregroundColor(.green)
                        } else {
                            Image( systemName:"xmark.seal").foregroundColor(.red)
                                .font(.system(size: 25))
                                .padding([.leading,.trailing], 15)
                            Text( "Not Genuine")
                                .font(.caption)
                                .foregroundColor(.red)
                        }
                    }
                    .padding(.trailing)
                }
            }
            .padding(.top, 8)
        }
    }
}


struct PassportSummaryView_Previews: PreviewProvider {
    static var previews: some View {
        
        let settings = SettingsStore()
        let passport = NFCPassportModel()

        return Group {
            PassportSummaryView(passport:passport)
                .environment( \.colorScheme, .light)
                .environmentObject(settings)

        }
    }
}
