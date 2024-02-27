import SwiftUI
import UIKit
import AVFoundation // Import AVFoundation for camera access check
import QKMRZScanner

struct QKMRZScannerViewRepresentable: UIViewRepresentable {
    class Coordinator: NSObject, QKMRZScannerViewDelegate {
        var parent: QKMRZScannerViewRepresentable

        init(_ parent: QKMRZScannerViewRepresentable) {
            self.parent = parent
        }

        func mrzScannerView(_ mrzScannerView: QKMRZScannerView, didFind scanResult: QKMRZScanResult) {
            // Example of accessing and using the scan result data
            let documentType = scanResult.documentType
            let countryCode = scanResult.countryCode
            let surnames = scanResult.surnames
            let givenNames = scanResult.givenNames
            let documentNumber = scanResult.documentNumber
            let expiryDate = scanResult.expiryDate
            let birthdate = scanResult.birthdate
            // Add more fields as needed

            // Log the results to the console or handle them as needed
            print("Scanned MRZ:")
            print("Document Type: \(documentType)")
            print("Country Code: \(countryCode)")
            print("Surnames: \(surnames)")
            print("Given Names: \(givenNames)")
            print("Document Number: \(documentNumber)")
            print("Expiry Date: \(expiryDate)")
            print("Birth Date: \(birthdate)")
            // Handle additional fields as needed

            // Example: Stop scanning after a successful scan
            DispatchQueue.main.async {
                mrzScannerView.stopScanning()
            }

            // Note: Depending on your app's architecture, you might want to notify other parts of your app about the scan result,
            // possibly using NotificationCenter, a custom delegate pattern, or a state management solution.
        }
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    func makeUIView(context: Context) -> QKMRZScannerView {
        let scannerView = QKMRZScannerView()
        scannerView.delegate = context.coordinator

        // Check camera permission and start scanning
        checkCameraPermission { authorized in
            if authorized {
                scannerView.startScanning()
            } else {
                // Handle the case where camera access was not granted
                print("Camera access was denied or not determined. Please enable access in Settings.")
            }
        }

        return scannerView
    }

    func updateUIView(_ uiView: QKMRZScannerView, context: Context) {
        // Optionally, adjust or implement updates to the view here
    }

    private func checkCameraPermission(completion: @escaping (Bool) -> Void) {
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized:
            completion(true)
        case .notDetermined:
            AVCaptureDevice.requestAccess(for: .video) { granted in
                DispatchQueue.main.async {
                    completion(granted)
                }
            }
        default:
            completion(false)
        }
    }
}
