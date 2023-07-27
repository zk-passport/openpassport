//
//  PassportReader.swift
//  AwesomeProject
//
//  Created by Y E on 27/07/2023.
//

import Foundation

@objc(PassportReader)
class PassportReader: NSObject{
  
  @objc
  func scanPassport(_ resolve:RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) {
    resolve("scanning the passport here")
  }
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return true
  }
}
