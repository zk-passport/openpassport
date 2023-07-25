// package com.awesomeproject; // replace your-apps-package-name with your app’s package name
// import com.facebook.react.bridge.NativeModule;
// import com.facebook.react.bridge.ReactApplicationContext;
// import com.facebook.react.bridge.ReactContext;
// import com.facebook.react.bridge.ReactContextBaseJavaModule;
// import com.facebook.react.bridge.ReactMethod;
// import java.util.Map;
// import java.util.HashMap;
// import android.util.Log;
// import com.facebook.react.modules.core.DeviceEventManagerModule;
// import com.facebook.react.bridge.ReactContext;
// import android.content.Intent;

// public class PassportReaderModule extends ReactContextBaseJavaModule {
//     private final ReactApplicationContext reactContext;

//     PassportReaderModule(ReactApplicationContext context) {
//         super(context);
//         this.reactContext = context;
//     }

//     // add to PassportReaderModule.java
//     @Override
//     public String getName() {
//         return "PassportReaderModule";
//     }

//     @ReactMethod
//     public void createPassportEvent(String name, String location) {
//         Log.d("PassportReaderModule", "Create event called with name: " + name
//         + " and location: " + location);
//     }

//     public void handleNFCIntent(Intent intent) {
//         var nfcData = "salut";
//         Log.d("PassportReaderModule", "handleNFCIntent");

//         // Handle the NFC intent, extract the data from the NFC tag
//         // Then send an event to React Native with the read NFC data
//         this.reactContext
//             .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
//             .emit("NFCDataRead", nfcData);
//     }

// }

