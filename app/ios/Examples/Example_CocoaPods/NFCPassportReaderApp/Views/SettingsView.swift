//
//  SettingsView.swift
//  NFCPassportReaderApp
//
//  Created by Andy Qua on 10/02/2021.
//  Copyright © 2021 Andy Qua. All rights reserved.
//

import SwiftUI
import NFCPassportReader

struct SettingsView: View {
    @EnvironmentObject var settings: SettingsStore
    
    private var logLevels = ["Verbose", "Debug", "Info", "Warning", "Error"]

    var body: some View {
        Form {
            Section(header: Text("Logging settings")) {
                Toggle(isOn: $settings.shouldCaptureLogs) {
                    Text("Should capture logs")
                }
                
                Picker(
                    selection: $settings.logLevel,
                    label: Text("Logging level")
                ) {
                    ForEach(LogLevel.allCases, id: \.self) {
                        Text(logLevels[$0.rawValue] ).tag($0)
                    }
                }

            }
            
            Section(header: Text("Passport reading settings")) {
                Toggle(isOn: $settings.useNewVerificationMethod) {
                    Text("Use new Passive Authentication")
                }
                .padding(.bottom)
                VStack {
                    Toggle(isOn: $settings.savePassportOnScan) {
                        Text("Save passport on scan & import")
                    }
                    HStack {
                        Text( "Note - currently stored as JSON on device\nWill not be backed up to iCloud" )
                            .font(.footnote)
                        Spacer()
                    }
                }
            }

        }
        .navigationBarTitle(Text("Settings"))
    }
}

struct SettingsView_Previews: PreviewProvider {
    static var previews: some View {
        let settings = SettingsStore()
        SettingsView()
            .environmentObject(settings)
    }
}
