//
//  ViewModifiers.swift
//  NFCPassportReaderApp
//
//  Created by Andy Qua on 10/02/2021.
//  Copyright © 2021 Andy Qua. All rights reserved.
//

import SwiftUI

struct ClearButton: ViewModifier {
    @Binding var text: String
    
    public func body(content: Content) -> some View {
        HStack {
            content
            if !text.isEmpty {
                Button(action: { self.text = "" },
                       label: {
                        Image(systemName: "delete.left")
                            .foregroundColor(Color(UIColor.opaqueSeparator))
                       }
                )
            }
        }
    }
}

struct VisibilityStyle: ViewModifier {
    
    @Binding var hidden: Bool
    func body(content: Content) -> some View {
        Group {
            if hidden {
                content.hidden()
            } else {
                content
            }
        }
    }
}
