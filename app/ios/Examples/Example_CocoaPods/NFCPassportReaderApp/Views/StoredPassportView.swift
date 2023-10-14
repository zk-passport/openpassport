//
//  StorePassportView.swift
//  NFCPassportReaderApp
//
//  Created by Andy Qua on 17/02/2021.
//  Copyright © 2021 Andy Qua. All rights reserved.
//

import SwiftUI
import NFCPassportReader

struct StoredPassportView: View {
    @EnvironmentObject var settings: SettingsStore
    @State private var showImport : Bool = false
    @State private var showDetails = false
    @State private var storedPassports = [URL]()
    
    var body: some View {
        ZStack {
            NavigationLink( destination: PassportView(), isActive: $showDetails) { Text("") }
            
            VStack {
                List {
                    ForEach(self.storedPassports, id: \.self) { item in
                        Button(action:{
                            if let data = try? Data(contentsOf: item),
                               let passport = loadPassport(data:data) {
                                self.settings.passport = passport
                                self.showDetails = true
                            }
                        }) {
                            HStack {
                                Text(item.deletingPathExtension().lastPathComponent)
                                Spacer()
                            }
                        }
                        .foregroundColor(.primary)
                    }
                    .onDelete(perform: deletePassport)
                }
                Spacer()
                if ( !settings.savePassportOnScan ) {
                    Text( "Imported or scanned passports are currently not being saved.\nThis can be changed in Settings" )
                        .multilineTextAlignment(.center)
                        .padding(10)
                }
            }

        }
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Menu {
                    Button(action: {self.showImport.toggle()}) {
                        Label("Import passport", systemImage: "doc")
                    }
                } label: {
                    Image(systemName: "square.and.arrow.down")
                        .foregroundColor(Color.secondary)
                }
            }
        }
        .fileImporter(
            isPresented: $showImport, allowedContentTypes: [.json,.text],
            allowsMultipleSelection: false
        ) { result in
            
            hideKeyboard()
            
            guard let selectedFile: URL = try? result.get().first else { return }
            if selectedFile.startAccessingSecurityScopedResource() {
                defer { selectedFile.stopAccessingSecurityScopedResource() }
                importFile( url:selectedFile )
            } else {
                print("Unable to read file contents - denied")
            }

        }
        .onAppear() {
            loadStoredPassports()
        }
    }
}

extension StoredPassportView {
    func loadStoredPassports() {
        
        do {
            let urls = try FileManager.default.contentsOfDirectory(at: FileManager.cachesFolder, includingPropertiesForKeys: nil, options: [])
            
            storedPassports = urls.filter { $0.pathExtension == "json" }
        } catch {
            print("Could not search for urls of files in documents directory: \(error)")
        }
    }
    
    func importFile( url : URL ) {
        Log.logLevel = settings.logLevel
        Log.storeLogs = settings.shouldCaptureLogs
        Log.clearStoredLogs()
        
        do {
            let data = try Data(contentsOf: url )
            if let passport = loadPassport( data: data ) {
                
                if ( settings.savePassportOnScan ) {
                    // Save passport to docs folder
                    let savedPath = FileManager.cachesFolder.appendingPathComponent("\(passport.documentNumber).json")
                    try? data.write(to: savedPath, options: .completeFileProtection)
                }
                
                self.settings.passport = passport
                self.showDetails = true
            }
        } catch {
            // Handle failure.
            print("Unable to read file contents")
            print(error.localizedDescription)
        }
    }
    
    func loadPassport( data: Data) -> NFCPassportModel? {
        let json = try? JSONSerialization.jsonObject(with: data, options: [])
        if let arr = json as? [String:String] {
            
            let passport = NFCPassportModel(from: arr)
            
            let masterListURL = Bundle.main.url(forResource: "masterList", withExtension: ".pem")!
            passport.verifyPassport(masterListURL: masterListURL)
            return passport
        }
        return nil
    }
    
    func deletePassport( at offsets: IndexSet) {
        
        let fm = FileManager.default
        offsets.forEach {
            let url = storedPassports[$0]
            try? fm.removeItem(at: url)
        }
        storedPassports.remove(atOffsets: offsets)
    }
}

struct StoredPassportView_Previews: PreviewProvider {
    static var previews: some View {
        let settings = SettingsStore()
        
        StoredPassportView()
            .environmentObject(settings)
    }
}
