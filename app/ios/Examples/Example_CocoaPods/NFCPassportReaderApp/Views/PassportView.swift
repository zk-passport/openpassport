
//
//  PassportView.swift
//  NFCPassportReaderApp
//
//  Created by Andy Qua on 30/06/2019.
//  Copyright © 2019 Andy Qua. All rights reserved.
//

import SwiftUI
import NFCPassportReader

struct PassportView : View {
    @EnvironmentObject var settings: SettingsStore
    @State private var showExportPassport : Bool = false
    
    var body: some View {
        VStack {
            NavigationLink( destination: ExportPassportView(), isActive: $showExportPassport) { Text("") }

            PassportSummaryView(passport:settings.passport!)
            HStack {

                Button(action: {showExportPassport.toggle()}) {
                    Label("Export passport", systemImage: "square.and.arrow.up")
                }
                .padding()
                Spacer()
                Button(action: {shareLogs()}) {
                    Label("Share logs", systemImage: "square.and.arrow.up")
                }
                .padding()
            }
            DetailsView(passport:settings.passport!)
        }
        .navigationTitle("Passport Details")
        .navigationBarTitleDisplayMode(.inline)
    }
}

extension PassportView {
    func shareLogs() {
        hideKeyboard()
        PassportUtils.shareLogs()
    }
}

#if DEBUG
struct PassportView_Previews : PreviewProvider {
    static var previews: some View {
        
        let passport : NFCPassportModel
        if let file = Bundle.main.url(forResource: "passport", withExtension: "json"),
           let data = try? Data(contentsOf: file),
           let json = try? JSONSerialization.jsonObject(with: data, options: []),
           let arr = json as? [String:String] {
            passport = NFCPassportModel(from: arr)
        } else {
            passport = NFCPassportModel()
        }
        let settings = SettingsStore()
        settings.passport = passport
        
        return NavigationView {
            PassportView()
                .environmentObject(settings)
                .environment( \.colorScheme, .light)
                .navigationTitle("WEEE")
                .navigationBarTitleDisplayMode(.inline)
        }
    }
}
#endif
