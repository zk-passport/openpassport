package com.awesomeproject;

import android.app.PendingIntent;
import android.content.Intent;
import android.content.IntentFilter;
import android.nfc.NfcAdapter;
import android.nfc.Tag;
import android.nfc.tech.IsoDep;
import android.os.Bundle;
import android.util.Log;
import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactActivityDelegate;
import com.facebook.react.shell.MainReactPackage;
import io.tradle.nfc.RNPassportReaderModule;

public class MainActivity extends ReactActivity {

  //   private NfcAdapter nfcAdapter;
  //   private PendingIntent pendingIntent;
  //   private IntentFilter[] intentFilters;
  //   private String[][] techList;

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  @Override
  protected String getMainComponentName() {
    return "AwesomeProject";
  }

  /**
   * Returns the instance of the {@link ReactActivityDelegate}. Here we use a util class {@link
   * DefaultReactActivityDelegate} which allows you to easily enable Fabric and Concurrent React
   * (aka React 18) with two boolean flags.
   */
  @Override
  protected ReactActivityDelegate createReactActivityDelegate() {
    return new DefaultReactActivityDelegate(
      this,
      getMainComponentName(),
      // If you opted-in for the New Architecture, we enable the Fabric Renderer.
      DefaultNewArchitectureEntryPoint.getFabricEnabled()
    );
  }

  //   @Override
  //   protected void onCreate(Bundle savedInstanceState) {
  //       super.onCreate(savedInstanceState);
  //       Log.d("MainActivity", "onCreate");

  //       nfcAdapter = NfcAdapter.getDefaultAdapter(this);

  //       Intent nfcIntent = new Intent(this, getClass());
  //       nfcIntent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);

  //       pendingIntent = PendingIntent.getActivity(this, 0, nfcIntent, PendingIntent.FLAG_IMMUTABLE);

  //       intentFilters = new IntentFilter[] {
  //           new IntentFilter(NfcAdapter.ACTION_TECH_DISCOVERED),
  //       };

  //       techList = new String[][] {
  //           new String[] { IsoDep.class.getName() }
  //       };
  //   }

  //   @Override
  //   protected void onResume() {
  //       super.onResume();
  //       Log.d("MainActivity", "onResume");
  //       if (nfcAdapter != null) {
  //           nfcAdapter.enableForegroundDispatch(this, pendingIntent, intentFilters, techList);
  //       }
  //   }

  //   @Override
  //   protected void onPause() {
  //       super.onPause();
  //       Log.d("MainActivity", "onPause");
  //       if (nfcAdapter != null) {
  //           nfcAdapter.disableForegroundDispatch(this);
  //       }
  //   }

  //   @Override
  //   public void onNewIntent(Intent intent) {
  //       super.onNewIntent(intent);
  //       Log.d("MainActivity", "Intent: " + intent.toString());

  //       // Check if this intent is a NFC discovery intent
  //       if (NfcAdapter.ACTION_TECH_DISCOVERED.equals(intent.getAction())) {
  //           try {
  //               // Get the PassportReaderModule instance from the ReactApplicationContext
  //               ReactApplication application = (ReactApplication) getApplication();
  //               ReactNativeHost host = application.getReactNativeHost();
  //               ReactInstanceManager reactInstanceManager = host.getReactInstanceManager();
  //               ReactContext reactContext = reactInstanceManager.getCurrentReactContext();
  //               Log.d("MainActivity", "ReactContext: " + reactContext);
  //               PassportReaderModule passportReaderModule = reactContext.getNativeModule(PassportReaderModule.class);
  //               Log.d("MainActivity", "PassportReaderModule: " + passportReaderModule);

  //               // Call the method in the PassportReaderModule that handles the NFC intent
  //               passportReaderModule.handleNFCIntent(intent);
  //           } catch (Exception e) {
  //               Log.e("MainActivity", "Error handling NFC intent", e);
  //           }
  //       }
  //   }

  @Override
  public void onNewIntent(Intent intent) {
    super.onNewIntent(intent);
    Log.d("MAIN_ACTIVITY", "onNewIntent: " + intent.getAction());
    RNPassportReaderModule.Companion.getInstance().receiveIntent(intent);
  }
}
