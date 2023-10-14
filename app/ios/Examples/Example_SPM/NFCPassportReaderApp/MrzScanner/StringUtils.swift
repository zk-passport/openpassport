/*
See LICENSE folder for this sample’s licensing information.

Abstract:
Utilities for dealing with recognized strings
*/

import Foundation

var captureFirst = ""
var captureSecond = ""
var captureThird = ""
var mrz = ""
var temp_mrz = ""

extension String {

	func checkMrz() -> (String)? {

        let tdOneFirstRegex = "(I|C|A).[A-Z0<]{3}[A-Z0-9]{1,9}<?[0-9O]{1}[A-Z0-9<]{14,22}"
        let tdOneSecondRegex = "[0-9O]{7}(M|F|<)[0-9O]{7}[A-Z0<]{3}[A-Z0-9<]{11}[0-9O]"
        let tdOneThirdRegex = "([A-Z0]+<)+<([A-Z0]+<)+<+"
        let tdOneMrzRegex = "(I|C|A).[A-Z0<]{3}[A-Z0-9]{1,9}<?[0-9O]{1}[A-Z0-9<]{14,22}\n[0-9O]{7}(M|F|<)[0-9O]{7}[A-Z0<]{3}[A-Z0-9<]{11}[0-9O]\n([A-Z0]+<)+<([A-Z0]+<)+<+"
        
        let tdThreeFirstRegex = "P.[A-Z0<]{3}([A-Z0]+<)+<([A-Z0]+<)+<+"
        let tdThreeSecondRegex = "[A-Z0-9]{1,9}<?[0-9O]{1}[A-Z0<]{3}[0-9]{7}(M|F|<)[0-9O]{7}[A-Z0-9<]+"
        let tdThreeMrzRegex = "P.[A-Z0<]{3}([A-Z0]+<)+<([A-Z0]+<)+<+\n[A-Z0-9]{1,9}<?[0-9O]{1}[A-Z0<]{3}[0-9]{7}(M|F|<)[0-9O]{7}[A-Z0-9<]+"
        
        let tdOneFirstLine = self.range(of: tdOneFirstRegex, options: .regularExpression, range: nil, locale: nil)
        let tdOneSecondLine = self.range(of: tdOneSecondRegex, options: .regularExpression, range: nil, locale: nil)
        let tdOneThirdLine = self.range(of: tdOneThirdRegex, options: .regularExpression, range: nil, locale: nil)

        let tdThreeFirstLine = self.range(of: tdThreeFirstRegex, options: .regularExpression, range: nil, locale: nil)
        let tdThreeSeconddLine = self.range(of: tdThreeSecondRegex, options: .regularExpression, range: nil, locale: nil)
        
        if(tdOneFirstLine != nil){
            if(self.count == 30){
                captureFirst = self
            }
        }
        if(tdOneSecondLine != nil){
            if(self.count == 30){
                captureSecond = self
            }
        }
        if(tdOneThirdLine != nil){
            if(self.count == 30){
                captureThird = self
            }
        }

        if(tdThreeFirstLine != nil){
            if(self.count == 44){
                captureFirst = self
            }
        }
        
        if(tdThreeSeconddLine != nil){
            if(self.count == 44){
                captureSecond = self
            }
        }
        
        
        if(captureFirst.count == 30 && captureSecond.count == 30 && captureThird.count == 30){
            temp_mrz = (captureFirst.stripped + "\n" + captureSecond.stripped + "\n" + captureThird.stripped).replacingOccurrences(of: " ", with: "<")

            let checkMrz = temp_mrz.range(of: tdOneMrzRegex, options: .regularExpression, range: nil, locale: nil)
            if(checkMrz != nil){
                mrz = temp_mrz
            }
        }
    
        if(captureFirst.count == 44 && captureSecond.count == 44){
            temp_mrz = (captureFirst.stripped + "\n" + captureSecond.stripped).replacingOccurrences(of: " ", with: "<")
            
            let checkMrz = temp_mrz.range(of: tdThreeMrzRegex, options: .regularExpression, range: nil, locale: nil)
            if(checkMrz != nil){
                mrz = temp_mrz
            }
        }
        
        if(mrz == ""){
            return nil
        }
		return mrz
	}
    
    var stripped: String {
        let okayChars = Set("ABCDEFGHIJKLKMNOPQRSTUVWXYZ1234567890<")
        return self.filter {okayChars.contains($0) }
    }
}

class StringTracker {
	var frameIndex: Int64 = 0

	typealias StringObservation = (lastSeen: Int64, count: Int64)
	
	// Dictionary of seen strings. Used to get stable recognition before
	// displaying anything.
	var seenStrings = [String: StringObservation]()
	var bestCount = Int64(0)
	var bestString = ""

	func logFrame(strings: [String]) {
		for string in strings {
			if seenStrings[string] == nil {
				seenStrings[string] = (lastSeen: Int64(0), count: Int64(-1))
			}
			seenStrings[string]?.lastSeen = frameIndex
			seenStrings[string]?.count += 1
			//print("Seen \(string) \(seenStrings[string]?.count ?? 0) times")
		}
	
		var obsoleteStrings = [String]()

		// Go through strings and prune any that have not been seen in while.
		// Also find the (non-pruned) string with the greatest count.
		for (string, obs) in seenStrings {
			// Remove previously seen text after 30 frames (~1s).
			if obs.lastSeen < frameIndex - 30 {
				obsoleteStrings.append(string)
			}
			
			// Find the string with the greatest count.
			let count = obs.count
			if !obsoleteStrings.contains(string) && count > bestCount {
				bestCount = Int64(count)
				bestString = string
			}
		}
		// Remove old strings.
		for string in obsoleteStrings {
			seenStrings.removeValue(forKey: string)
		}
		
		frameIndex += 1
	}
	
	func getStableString() -> String? {
		// Require the recognizer to see the same string at least 10 times.
		if bestCount >= 10 {
			return bestString
		} else {
			return nil
		}
	}
	
	func reset(string: String) {
		seenStrings.removeValue(forKey: string)
		bestCount = 0
		bestString = ""
        captureFirst = ""
        captureSecond = ""
        captureThird = ""
        mrz = ""
        temp_mrz = ""
	}
}
