//
//  ExportPassportView.swift
//  NFCPassportReaderApp
//
//  Created by Andy Qua on 11/02/2021.
//  Copyright © 2021 Andy Qua. All rights reserved.
//

import SwiftUI
import NFCPassportReader

struct MultipleSelectionRow: View {
    var title: String
    var isSelected: Bool
    var action: () -> Void
    
    var body: some View {
        Button(action: self.action) {
            HStack {
                Text(self.title)
                if self.isSelected {
                    Spacer()
                    Image(systemName: "checkmark")
                }
            }
        }
        .foregroundColor(.primary)
    }
}

struct ExportPassportView: View {
    @EnvironmentObject var settings: SettingsStore
        
    @State var items: [DataGroupId] = []
    @State var selections: [DataGroupId] = []
    @State var isAASupported : Bool = false
    @State var includeAA : Bool = false
    
    var body: some View {
        Form {
            Section(header: Text("Select Passport items to export"), footer:Text("* contains personal information")) {
                List {
                    ForEach(items, id: \.self) { item in
                        MultipleSelectionRow(title: dgToText(item), isSelected: self.selections.contains(item)) {
                            if self.selections.contains(item) {
                                self.selections.removeAll(where: { $0 == item })
                            }
                            else {
                                self.selections.append(item)
                            }
                        }
                    }
                }
                if isAASupported {
                    Toggle("Include Active Authentication Challenge/Response?", isOn: $includeAA)
                        .foregroundColor(.primary)
                }
            }
            Button(action: {
                sharePassport()
            }, label: {
                Text("Export selected passport details")
                    .font(.title3)
            })
            .foregroundColor(.primary)
        }
        .navigationTitle("Export passport")
        .onAppear() {
            if let passport = settings.passport {
                items = [.SOD, .COM]
                items.append(contentsOf: DataGroupId.allCases.filter { passport.dataGroupsAvailable.contains($0) } )
                
                // Default select only the DGs that contain no personal info.
                selections = [.SOD, .COM, .DG14, .DG15]
                isAASupported = passport.activeAuthenticationSupported
                if isAASupported {
                    includeAA = true
                }
            } 
        }
    }
}

extension ExportPassportView {
    func sharePassport() {
        do {
            let dict = settings.passport!.dumpPassportData( selectedDataGroups:selections,includeActiveAuthenticationData: includeAA)
            let data = try JSONSerialization.data(withJSONObject: dict, options: .prettyPrinted)
            
            let temporaryURL = URL(fileURLWithPath: NSTemporaryDirectory() + "passport.json")
            try data.write(to: temporaryURL)
            
            let av = UIActivityViewController(activityItems: [temporaryURL], applicationActivities: nil)
            
            let keyWindow = UIApplication.shared.connectedScenes
                .filter({$0.activationState == .foregroundActive})
                .map({$0 as? UIWindowScene})
                .compactMap({$0})
                .first?.windows
                .filter({$0.isKeyWindow}).first

            keyWindow?.rootViewController?.present(av, animated: true, completion: nil)
        } catch {
            print( "ERROR - \(error)" )
        }
    }
    
    func dgToText( _ dg : DataGroupId ) -> String {
        switch ( dg ) {
            case .SOD:
                return "SOD - Document Security Object"
            case .COM:
                return "COM - Header and DG Presence"
            case .DG1:
                return "DG1* - MRZ Info"
            case .DG2:
                return "DG2* - Face image"
            case .DG3:
                return "DG3* - Fingerprints"
            case .DG4:
                return "DG4* - Iris"
            case .DG5:
                return "DG5* - Displayed portrait"
            case .DG6:
                return "DG6 - Reserved"
            case .DG7:
                return "DG7* - Signature"
            case .DG8:
                return "DG8* - Data features"
            case .DG9:
                return "DG9* - Structure features"
            case .DG10:
                return "DG10* - Substance features"
            case .DG11:
                return "DG11* - Additional personal info"
            case .DG12:
                return "DG12* - Additional document info"
            case .DG13:
                return "DG13* - Optional details"
            case .DG14:
                return "DG14 - Security options"
            case .DG15:
                return "DG15 - Active Auth PubKey"
            case .DG16:
                return "DG16 - Person(s) to notify"
            default:
                return "Unknown"
        }
    }

}


struct ExportPassportView_Previews: PreviewProvider {
    static var previews: some View {
        let settings = SettingsStore()
        settings.passport = NFCPassportModel()
        
        return NavigationView {
            ExportPassportView()
        }
        .environmentObject(settings)
    }
}
