//
//  CheckBoxView.swift
//  NFCPassportReaderApp
//
//  Created by Andy Qua on 10/02/2021.
//  Copyright © 2021 Andy Qua. All rights reserved.
//

import SwiftUI

struct CheckBoxButtonStyle: ButtonStyle {
    
    func makeBody(configuration: Self.Configuration) -> some View {
        configuration.label
            .foregroundColor(.secondary)
    }
}


struct CheckBoxView: View {
    @Binding var checked: Bool
    var text : String
    
    var body: some View {
        HStack() {
            
            Button(action: {
                withAnimation {
                    self.checked.toggle()
                }
            }) {
                HStack(alignment: .center, spacing: 10) {
                    Text(text)
                    Image(systemName:self.checked ? "checkmark.square.fill" : "square")
                }
            }
            .frame(height: 44, alignment: .center)
            .padding(.trailing)
            .buttonStyle(CheckBoxButtonStyle())
        }
    }
}

struct CheckBoxView_Previews: PreviewProvider {
    static var previews: some View {
        CheckBoxView( checked: .constant(true), text:"Are you on?")
    }
}
