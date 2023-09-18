cd ../android

./gradlew clean
./gradlew cargoBuild

cd ..

mkdir -p android/react-native-passport-reader/android/src/main/jniLibs/arm64/
cp halo2-passport/target/aarch64-linux-android/release/libhalo2_passport.so android/react-native-passport-reader/android/src/main/jniLibs/arm64/