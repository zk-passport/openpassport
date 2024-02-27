//
//  MRZScannerModule.swift
//  ProofOfPassport
//
//  Created by Rémi Colin on 27/02/2024.
//

import Foundation
import React
import SwiftUI


@objc(MRZScannerModule)
class MRZScannerModule: NSObject, RCTBridgeModule {
  static func moduleName() -> String! {
    return "MRZScannerModule"
  }

  static func requiresMainQueueSetup() -> Bool {
    return true
  }

  @objc func startScanning(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
      DispatchQueue.main.async { // Ensure UI updates are on the main thread
          // Create local copies of the resolve and reject closures
          let localResolve = resolve
          let localReject = reject

          guard let rootViewController = UIApplication.shared.keyWindow?.rootViewController else {
              localReject("error", "Unable to find root view controller", nil)
              return
          }
          
          // Create the SwiftUI view
          let scannerView = QKMRZScannerViewRepresentable()
          // Wrap the SwiftUI view in a UIHostingController
          let hostingController = UIHostingController(rootView: scannerView)
          
          // Present the view controller
          rootViewController.present(hostingController, animated: true, completion: {
              localResolve("Scanning started")
          })
      }
  }



  @objc func stopScanning(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    // Logic to stop scanning
    resolve("Scanning stopped")
  }
}

