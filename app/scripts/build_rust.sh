cd ../android

./gradlew clean
./gradlew cargoBuild

cd ..

mkdir -p android/react-native-passport-reader/android/src/main/jniLibs/arm64/
# if [ -f "ark-circom-passport/target/aarch64-linux-android/release/libark_circom_passport.so" ]; then
  echo copied release version
  cp ark-circom-passport/target/aarch64-linux-android/release/libark_circom_passport.so android/react-native-passport-reader/android/src/main/jniLibs/arm64/
# elif [ -f "ark-circom-passport/target/aarch64-linux-android/debug/libark_circom_passport.so" ]; then
  # echo copied debug version
  # cp ark-circom-passport/target/aarch64-linux-android/debug/libark_circom_passport.so android/react-native-passport-reader/android/src/main/jniLibs/arm64/
# fi


