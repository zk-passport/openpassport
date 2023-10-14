//
//  MRZScannerViewController.swift
//  NFCPassportReaderApp
//
//  Created by Andy Qua on 17/02/2021.
//  Copyright © 2021 Andy Qua. All rights reserved.
//

import UIKit
import SwiftUI
import QKMRZScanner

// Wraps the QKMRZScanner component in a simple UIView that allows a scan of the MRZ area from a Passport/ID Card
struct MRZScanner: UIViewControllerRepresentable {
    let completionHandler: (String,Date,Date) -> Void
    
    func makeUIViewController(context: Context) -> MRZScannerViewController {
        let vc = MRZScannerViewController()
        vc.mrzScannerView.delegate = context.coordinator
        return vc
    }
    
    func updateUIViewController(_ uiViewController: MRZScannerViewController, context: Context) {
        
    }
    
    func makeCoordinator() -> Coordinator {
        return Coordinator(completionHandler: completionHandler)
    }
    
    final class Coordinator: NSObject, QKMRZScannerViewDelegate {
        let completionHandler: (String,Date,Date) -> Void
        
        init(completionHandler: @escaping (String,Date,Date) -> Void) {
            self.completionHandler = completionHandler
        }
        
        func mrzScannerView(_ mrzScannerView: QKMRZScannerView, didFind scanResult: QKMRZScanResult) {
            print(scanResult)
            if let dob = scanResult.birthdate, let doe = scanResult.expiryDate {
                completionHandler(scanResult.documentNumber, dob, doe)
            }
        }
    }
}

// MARK: UIViewController implementation
class MRZScannerViewController: UIViewController {
    let mrzScannerView = QKMRZScannerView()
            
    override func viewDidLoad() {
        super.viewDidLoad()
        self.title = "Scan Passport"
        self.navigationController?.title = "Scan passport"


        let lbl = UILabel()
        lbl.text = "Please scan the Machine Readable Zone."
        lbl.numberOfLines = 0
        self.view.addSubview(mrzScannerView)
        self.view.addSubview(lbl)

        mrzScannerView.translatesAutoresizingMaskIntoConstraints = false
        mrzScannerView.topAnchor.constraint(equalTo: view.topAnchor, constant:50).isActive = true
        mrzScannerView.centerXAnchor.constraint(equalTo: view.centerXAnchor).isActive = true
        mrzScannerView.widthAnchor.constraint(equalToConstant: view.bounds.width).isActive = true
        mrzScannerView.heightAnchor.constraint(equalToConstant: view.bounds.width).isActive = true

        lbl.translatesAutoresizingMaskIntoConstraints = false
        lbl.leadingAnchor.constraint(equalTo: mrzScannerView.leadingAnchor, constant: 10).isActive = true
        lbl.topAnchor.constraint(equalTo: mrzScannerView.bottomAnchor, constant: 10).isActive = true
        lbl.trailingAnchor.constraint(equalTo: mrzScannerView.trailingAnchor, constant: 10).isActive = true
    }
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        mrzScannerView.startScanning()
    }

    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        mrzScannerView.stopScanning()
    }
}

extension MRZScannerViewController : QKMRZScannerViewDelegate {
    func mrzScannerView(_ mrzScannerView: QKMRZScannerView, didFind scanResult: QKMRZScanResult) {
        print(scanResult)
    }
}

