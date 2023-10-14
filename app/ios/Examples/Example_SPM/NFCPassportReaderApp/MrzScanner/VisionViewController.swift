/*
See LICENSE folder for this sample’s licensing information.

Abstract:
Vision view controller.
			Recognizes text using a Vision VNRecognizeTextRequest request handler in pixel buffers from an AVCaptureOutput.
			Displays bounding boxes around recognized text results in real time.
*/

import Foundation
import UIKit
import AVFoundation
import Vision
import SwiftUI

// Wraps the VisionViewController component in a simple UIView that allows a scan of the MRZ area from a Passport/ID Card
public struct MRZScanner: UIViewControllerRepresentable {
    let completionHandler: (String) -> Void
    
    public init(completionHandler: @escaping (String) -> (Void)) {
        self.completionHandler = completionHandler
    }

    public func makeUIViewController(context: Context) -> VisionViewController {
        let vc = VisionViewController()
        
        vc.completionHandler = { (mrz) in
            completionHandler( mrz )
        }
        return vc
    }
    
    public func updateUIViewController(_ uiViewController: VisionViewController, context: Context) {
        
    }
}


public class VisionViewController: ViewController {
	var request: VNRecognizeTextRequest!
	// Temporal string tracker
	let mrzTracker = StringTracker()
	
    var completionHandler: ((String) -> (Void))?

	public override func viewDidLoad() {
		// Set up vision request before letting ViewController set up the camera
		// so that it exists when the first buffer is received.
		request = VNRecognizeTextRequest(completionHandler: recognizeTextHandler)

		super.viewDidLoad()
	}
	
	// MARK: - Text recognition
	
	// Vision recognition handler.
	func recognizeTextHandler(request: VNRequest, error: Error?) {
		var redBoxes = [CGRect]() // Shows all recognized text lines
		var greenBoxes = [CGRect]() // Shows words that might be serials
        var codes = [String]()

		guard let results = request.results as? [VNRecognizedTextObservation] else {
			return
		}
		
		let maximumCandidates = 1
		for visionResult in results {
            guard let candidate = visionResult.topCandidates(maximumCandidates).first else { continue }
			
			var numberIsSubstring = true

			if let result = candidate.string.checkMrz() {
                if(result != "nil"){
                    codes.append(result)
                    numberIsSubstring = false

                    greenBoxes.append(visionResult.boundingBox)
                }
			}

			if numberIsSubstring {
				redBoxes.append(visionResult.boundingBox)
			}
		}
		
		// Log any found numbers.
        mrzTracker.logFrame(strings: codes)
		show(boxGroups: [(color: UIColor.red.cgColor, boxes: redBoxes), (color: UIColor.green.cgColor, boxes: greenBoxes)])
		
		// Check if we have any temporally stable numbers.
		if let sureNumber = mrzTracker.getStableString() {
			showString(string: sureNumber)
			mrzTracker.reset(string: sureNumber)
            
            DispatchQueue.main.async {
                self.completionHandler?(sureNumber)
            }

		}
	}
	
    public override func captureOutput(_ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection) {
		if let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) {
			// Configure for running in real-time.
			request.recognitionLevel = .fast
			// Language correction won't help recognizing phone numbers. It also
			// makes recognition slower.
			request.usesLanguageCorrection = false
			// Only run on the region of interest for maximum speed.
			request.regionOfInterest = regionOfInterest
			
			let requestHandler = VNImageRequestHandler(cvPixelBuffer: pixelBuffer, orientation: textOrientation, options: [:])
			do {
				try requestHandler.perform([request])
			} catch {
				print(error)
			}
		}
	}
	
	// MARK: - Bounding box drawing
	
	// Draw a box on screen. Must be called from main queue.
	var boxLayer = [CAShapeLayer]()
	func draw(rect: CGRect, color: CGColor) {
		let layer = CAShapeLayer()
		layer.opacity = 0.5
		layer.borderColor = color
		layer.borderWidth = 1
		layer.frame = rect
		boxLayer.append(layer)
		previewView.videoPreviewLayer.insertSublayer(layer, at: 1)
	}
	
	// Remove all drawn boxes. Must be called on main queue.
	func removeBoxes() {
		for layer in boxLayer {
			layer.removeFromSuperlayer()
		}
		boxLayer.removeAll()
	}
	
	typealias ColoredBoxGroup = (color: CGColor, boxes: [CGRect])
	
	// Draws groups of colored boxes.
	func show(boxGroups: [ColoredBoxGroup]) {
		DispatchQueue.main.async {
			let layer = self.previewView.videoPreviewLayer
			self.removeBoxes()
			for boxGroup in boxGroups {
				let color = boxGroup.color
				for box in boxGroup.boxes {
					let rect = layer.layerRectConverted(fromMetadataOutputRect: box.applying(self.visionToAVFTransform))
					self.draw(rect: rect, color: color)
				}
			}
		}
	}

}
