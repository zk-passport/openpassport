Working:
- France
- Guy from ETH Global Paris (Moldavia ? Bulgaria ?)
- Malaysia

Crashing:
- Thailand
- Britain


 E  FATAL EXCEPTION: main
                                                                                                    Process: com.proofofpassportapp, PID: 14479
                                                                                                    java.lang.ClassCastException: org.bouncycastle.jcajce.provider.asymmetric.ec.BCECPublicKey cannot be cast to java.security.interfaces.RSAPublicKey
                                                                                                    	at io.tradle.nfc.RNPassportReaderModule$ReadTask.onPostExecute(RNPassportReaderModule.kt:510)
                                                                                                    	at io.tradle.nfc.RNPassportReaderModule$ReadTask.onPostExecute(RNPassportReaderModule.kt:238)
                                                                                                    	at android.os.AsyncTask.finish(AsyncTask.java:771)
                                                                                                    	at android.os.AsyncTask.access$900(AsyncTask.java:199)
                                                                                                    	at android.os.AsyncTask$InternalHandler.handleMessage(AsyncTask.java:788)
                                                                                                    	at android.os.Handler.dispatchMessage(Handler.java:106)
                                                                                                    	at android.os.Looper.loopOnce(Looper.java:226)
                                                                                                    	at android.os.Looper.loop(Looper.java:313)
                                                                                                    	at android.app.ActivityThread.main(ActivityThread.java:8751)
                                                                                                    	at java.lang.reflect.Method.invoke(Native Method)
                                                                                                    	at com.android.internal.os.RuntimeInit$MethodAndArgsCaller.run(RuntimeInit.java:571)
                                                                                                    	at com.android.internal.os.ZygoteInit.main(ZygoteInit.java:1135)
2023-10-31 16:41:37.052   625-625   SurfaceFlinger          pid-625                              E  Attempt to update InputPolicyFlags without permission ACCESS_SURFACE_FLINGER
2023-10-31 16:41:37.069   625-625   SurfaceFlinger          pid-625                              E  Attempt to update InputPolicyFlags without permission ACCESS_SURFACE_FLINGER
2023-10-31 16:41:37.088   625-625   SurfaceFlinger          pid-625                              E  Attempt to update InputPolicyFlags without permission ACCESS_SURFACE_FLINGER
2023-10-31 16:41:37.102   625-625   SurfaceFlinger          pid-625                              E  Attempt to update InputPolicyFlags without permission ACCESS_SURFACE_FLINGER
2023-10-31 16:41:37.108  1377-2420  TaskStackL...erAbstract pid-1377                             E  onTaskSnapshotChanged calle