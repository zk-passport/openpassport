cd ../android

./gradlew clean
./gradlew cargoBuild

cd ..

cp halo2-passport/target/aarch64-linux-android/debug/libhalo2_passport.so android/react-native-passport-reader/android/src/main/jniLibs/arm64/