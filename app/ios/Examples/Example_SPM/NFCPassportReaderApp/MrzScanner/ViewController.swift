/*
See LICENSE folder for this sample’s licensing information.

Abstract:
Main view controller: handles camera, preview and cutout UI.
*/

import UIKit
import AVFoundation
import Vision

public class ViewController: UIViewController {
	// MARK: - UI objects
	var previewView: PreviewView!
	var cutoutView: UIView!
	var numberView: UILabel!
    
	var maskLayer = CAShapeLayer()
	// Device orientation. Updated whenever the orientation changes to a
	// different supported orientation.
	var currentOrientation = UIDeviceOrientation.portrait
	
	// MARK: - Capture related objects
	private let captureSession = AVCaptureSession()
    let captureSessionQueue = DispatchQueue(label: "com.example.apple-samplecode.CaptureSessionQueue")
    
	var captureDevice: AVCaptureDevice?
    
	var videoDataOutput = AVCaptureVideoDataOutput()
    let videoDataOutputQueue = DispatchQueue(label: "com.example.apple-samplecode.VideoDataOutputQueue")
    
	// MARK: - Region of interest (ROI) and text orientation
	// Region of video data output buffer that recognition should be run on.
	// Gets recalculated once the bounds of the preview layer are known.
	var regionOfInterest = CGRect(x: 0, y: 0, width: 1, height: 1)
	// Orientation of text to search for in the region of interest.
	var textOrientation = CGImagePropertyOrientation.up
	
	// MARK: - Coordinate transforms
	var bufferAspectRatio: Double!
	// Transform from UI orientation to buffer orientation.
	var uiRotationTransform = CGAffineTransform.identity
	// Transform bottom-left coordinates to top-left.
	var bottomToTopTransform = CGAffineTransform(scaleX: 1, y: -1).translatedBy(x: 0, y: -1)
	// Transform coordinates in ROI to global coordinates (still normalized).
	var roiToGlobalTransform = CGAffineTransform.identity
	
	// Vision -> AVF coordinate transform.
	var visionToAVFTransform = CGAffineTransform.identity
	
	// MARK: - View controller methods
	
	public override func viewDidLoad() {
		super.viewDidLoad()
        
        // Create views
        previewView = PreviewView()
        cutoutView =  UIView()
        numberView = UILabel()
        previewView.translatesAutoresizingMaskIntoConstraints = false
        cutoutView.translatesAutoresizingMaskIntoConstraints = false
        numberView.translatesAutoresizingMaskIntoConstraints = false

        self.view.addSubview(previewView)
        self.view.addSubview(cutoutView)
        self.view.addSubview(numberView)
        previewView.centerXAnchor.constraint(equalTo: view.centerXAnchor).isActive = true
        previewView.trailingAnchor.constraint(equalTo: view.trailingAnchor).isActive = true
        previewView.centerYAnchor.constraint(equalTo: view.centerYAnchor).isActive = true
        previewView.bottomAnchor.constraint(equalTo: view.bottomAnchor).isActive = true
        
        cutoutView.centerXAnchor.constraint(equalTo: view.centerXAnchor).isActive = true
        cutoutView.trailingAnchor.constraint(equalTo: view.trailingAnchor).isActive = true
        cutoutView.centerYAnchor.constraint(equalTo: view.centerYAnchor).isActive = true
        cutoutView.bottomAnchor.constraint(equalTo: view.bottomAnchor).isActive = true
        
        numberView.centerXAnchor.constraint(equalTo: view.centerXAnchor).isActive = true
        numberView.centerYAnchor.constraint(equalTo: view.centerYAnchor).isActive = true
        
        let tgr = UITapGestureRecognizer(target: self, action: #selector(handleTap(_:)))
        self.view.addGestureRecognizer(tgr)
        tgr.cancelsTouchesInView = true
        tgr.delaysTouchesEnded = true
        tgr.requiresExclusiveTouchType = true
		
		// Set up preview view.
		previewView.session = captureSession
		
		// Set up cutout view.
		cutoutView.backgroundColor = UIColor.gray.withAlphaComponent(0.5)
		maskLayer.backgroundColor = UIColor.clear.cgColor
		maskLayer.fillRule = .evenOdd
		cutoutView.layer.mask = maskLayer
		
        // Starting the capture session is a blocking call. Perform setup using
        // a dedicated serial dispatch queue to prevent blocking the main thread.
        captureSessionQueue.async {
            self.setupCamera()
            
            // Calculate region of interest now that the camera is setup.
            DispatchQueue.main.async {
                // Figure out initial ROI.
                self.calculateRegionOfInterest()
            }
        }
	}
	
	public override func viewWillTransition(to size: CGSize, with coordinator: UIViewControllerTransitionCoordinator) {
		super.viewWillTransition(to: size, with: coordinator)

		// Only change the current orientation if the new one is landscape or
		// portrait. You can't really do anything about flat or unknown.
		let deviceOrientation = UIDevice.current.orientation
		if deviceOrientation.isPortrait || deviceOrientation.isLandscape {
			currentOrientation = deviceOrientation
		}
		
		// Handle device orientation in the preview layer.
		if let videoPreviewLayerConnection = previewView.videoPreviewLayer.connection {
			if let newVideoOrientation = AVCaptureVideoOrientation(deviceOrientation: deviceOrientation) {
				videoPreviewLayerConnection.videoOrientation = newVideoOrientation
			}
		}
		
		// Orientation changed: figure out new region of interest (ROI).
		calculateRegionOfInterest()
	}
	
	public override func viewDidLayoutSubviews() {
		super.viewDidLayoutSubviews()
		updateCutout()
	}
	
	// MARK: - Setup
	
	func calculateRegionOfInterest() {
		// In landscape orientation the desired ROI is specified as the ratio of
		// buffer width to height. When the UI is rotated to portrait, keep the
		// vertical size the same (in buffer pixels). Also try to keep the
		// horizontal size the same up to a maximum ratio.
        let desiredHeightRatio = 0.2
        let desiredWidthRatio = 0.8
        let maxPortraitWidth = 0.9
		// Figure out size of ROI.
		let size: CGSize
		if currentOrientation.isPortrait || currentOrientation == .unknown {
			size = CGSize(width: min(desiredWidthRatio * bufferAspectRatio, maxPortraitWidth), height: desiredHeightRatio / bufferAspectRatio)
		} else {
			size = CGSize(width: desiredWidthRatio, height: desiredHeightRatio)
		}
		// Make it centered.
		regionOfInterest.origin = CGPoint(x: (1 - size.width) / 2, y: (1 - size.height) / 2)
		regionOfInterest.size = size
		
		// ROI changed, update transform.
		setupOrientationAndTransform()
		
		// Update the cutout to match the new ROI.
		DispatchQueue.main.async {
			// Wait for the next run cycle before updating the cutout. This
			// ensures that the preview layer already has its new orientation.
			self.updateCutout()
		}
	}
	
	func updateCutout() {
		// Figure out where the cutout ends up in layer coordinates.
		let roiRectTransform = bottomToTopTransform.concatenating(uiRotationTransform)
		let cutout = previewView.videoPreviewLayer.layerRectConverted(fromMetadataOutputRect: regionOfInterest.applying(roiRectTransform))
		
		// Create the mask.
		let path = UIBezierPath(rect: cutoutView.frame)
		path.append(UIBezierPath(rect: cutout))
		maskLayer.path = path.cgPath
		
		// Move the number view down to under cutout.
		var numFrame = cutout
		numFrame.origin.y += numFrame.size.height
		numberView.frame = numFrame
        numberView.numberOfLines = 3
        numberView.font = numberView.font.withSize(9)

	}
	
	func setupOrientationAndTransform() {
		// Recalculate the affine transform between Vision coordinates and AVF coordinates.
		
		// Compensate for region of interest.
		let roi = regionOfInterest
		roiToGlobalTransform = CGAffineTransform(translationX: roi.origin.x, y: roi.origin.y).scaledBy(x: roi.width, y: roi.height)
		
		// Compensate for orientation (buffers always come in the same orientation).
		switch currentOrientation {
		case .landscapeLeft:
			textOrientation = CGImagePropertyOrientation.up
			uiRotationTransform = CGAffineTransform.identity
		case .landscapeRight:
			textOrientation = CGImagePropertyOrientation.down
			uiRotationTransform = CGAffineTransform(translationX: 1, y: 1).rotated(by: CGFloat.pi)
		case .portraitUpsideDown:
			textOrientation = CGImagePropertyOrientation.left
			uiRotationTransform = CGAffineTransform(translationX: 1, y: 0).rotated(by: CGFloat.pi / 2)
		default: // We default everything else to .portraitUp
			textOrientation = CGImagePropertyOrientation.right
			uiRotationTransform = CGAffineTransform(translationX: 0, y: 1).rotated(by: -CGFloat.pi / 2)
		}
		
		// Full Vision ROI to AVF transform.
		visionToAVFTransform = roiToGlobalTransform.concatenating(bottomToTopTransform).concatenating(uiRotationTransform)
	}
	
	func setupCamera() {
		guard let captureDevice = AVCaptureDevice.default(.builtInWideAngleCamera, for: AVMediaType.video, position: .back) else {
			print("Could not create capture device.")
			return
		}
		self.captureDevice = captureDevice
		
		// NOTE:
		// Requesting 4k buffers allows recognition of smaller text but will
		// consume more power. Use the smallest buffer size necessary to keep
		// down battery usage.
		if captureDevice.supportsSessionPreset(.hd4K3840x2160) {
			captureSession.sessionPreset = AVCaptureSession.Preset.hd4K3840x2160
			bufferAspectRatio = 3840.0 / 2160.0
		} else {
			captureSession.sessionPreset = AVCaptureSession.Preset.hd1920x1080
			bufferAspectRatio = 1920.0 / 1080.0
		}
		
		guard let deviceInput = try? AVCaptureDeviceInput(device: captureDevice) else {
			print("Could not create device input.")
			return
		}
		if captureSession.canAddInput(deviceInput) {
			captureSession.addInput(deviceInput)
		}
		
		// Configure video data output.
		videoDataOutput.alwaysDiscardsLateVideoFrames = true
		videoDataOutput.setSampleBufferDelegate(self, queue: videoDataOutputQueue)
		videoDataOutput.videoSettings = [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_420YpCbCr8BiPlanarFullRange]
		if captureSession.canAddOutput(videoDataOutput) {
			captureSession.addOutput(videoDataOutput)
			// NOTE:
			// There is a trade-off to be made here. Enabling stabilization will
			// give temporally more stable results and should help the recognizer
			// converge. But if it's enabled the VideoDataOutput buffers don't
			// match what's displayed on screen, which makes drawing bounding
			// boxes very hard. Disable it in this app to allow drawing detected
			// bounding boxes on screen.
			videoDataOutput.connection(with: AVMediaType.video)?.preferredVideoStabilizationMode = .off
		} else {
			print("Could not add VDO output")
			return
		}
		
		// Set zoom and autofocus to help focus on very small text.
		do {
			try captureDevice.lockForConfiguration()
            captureDevice.videoZoomFactor = 1.5
			captureDevice.autoFocusRangeRestriction = .near
			captureDevice.unlockForConfiguration()
		} catch {
			print("Could not set zoom level due to error: \(error)")
			return
		}
		
		captureSession.startRunning()
	}
	
	// MARK: - UI drawing and interaction
	
	func showString(string: String) {
		// Found a definite number.
		// Stop the camera synchronously to ensure that no further buffers are
		// received. Then update the number view asynchronously.
		captureSessionQueue.sync {
			self.captureSession.stopRunning()
            DispatchQueue.main.async {
                self.numberView.text = string
                self.numberView.isHidden = false
            }
		}
	}
	
	@IBAction func handleTap(_ sender: UITapGestureRecognizer) {
        captureSessionQueue.async {
            if !self.captureSession.isRunning {
                self.captureSession.startRunning()
            }
            DispatchQueue.main.async {
                self.numberView.isHidden = true
            }
        }
	}
}

// MARK: - AVCaptureVideoDataOutputSampleBufferDelegate

extension ViewController: AVCaptureVideoDataOutputSampleBufferDelegate {
	
	public func captureOutput(_ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection) {
		// This is implemented in VisionViewController.
	}
}

// MARK: - Utility extensions

extension AVCaptureVideoOrientation {
	init?(deviceOrientation: UIDeviceOrientation) {
		switch deviceOrientation {
		case .portrait: self = .portrait
		case .portraitUpsideDown: self = .portraitUpsideDown
		case .landscapeLeft: self = .landscapeRight
		case .landscapeRight: self = .landscapeLeft
		default: return nil
		}
	}
}
