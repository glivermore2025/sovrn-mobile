# Google Play Release Checklist

## Build Signing

Release builds must not use the debug keystore. The Android Gradle config reads
these environment variables for the upload key:

```powershell
$env:SOVRN_UPLOAD_STORE_FILE='C:\path\to\sovrn-upload-key.jks'
$env:SOVRN_UPLOAD_STORE_PASSWORD='...'
$env:SOVRN_UPLOAD_KEY_ALIAS='sovrn-upload'
$env:SOVRN_UPLOAD_KEY_PASSWORD='...'
```

`SOVRN_UPLOAD_STORE_FILE` may be an absolute path or a path relative to the
repo root.

For local builds, the release scripts also load these values from the ignored
`release-signing.local` file when it exists. Do not use a `.env.*` filename for
release signing secrets because Expo automatically loads `.env*` files during
`expo start` and may try to parse or expose signing-only values in development.

Build the Play upload artifact:

```powershell
npm run build:android:release
```

If Codespaces reports `Unsupported class file major version 69`, Gradle is
running under Java 25. Install/switch to JDK 17 before rerunning:

```bash
sudo apt-get update
sudo apt-get install -y openjdk-17-jdk
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export PATH="$JAVA_HOME/bin:$PATH"
java -version
npm run build:android:release
```

If Codespaces reports `SDK location not found`, install the Android SDK pieces
that match the Expo/Gradle config and point Gradle at them:

```bash
sudo apt-get update
sudo apt-get install -y unzip openjdk-17-jdk
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export ANDROID_HOME="$HOME/android-sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"

mkdir -p "$ANDROID_HOME/cmdline-tools"
curl -fsSL https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -o /tmp/android-commandlinetools.zip
rm -rf /tmp/android-commandlinetools
unzip -q /tmp/android-commandlinetools.zip -d /tmp/android-commandlinetools
rm -rf "$ANDROID_HOME/cmdline-tools/latest"
mkdir -p "$ANDROID_HOME/cmdline-tools/latest"
mv /tmp/android-commandlinetools/cmdline-tools/* "$ANDROID_HOME/cmdline-tools/latest/"

yes | sdkmanager --licenses
sdkmanager "platform-tools" "platforms;android-35" "build-tools;35.0.0" "ndk;27.1.12297006"
printf 'sdk.dir=%s\n' "$ANDROID_HOME" > android/local.properties

npm run build:android:release
```

Upload `android\app\build\outputs\bundle\release\app-release.aab` to Play
Console.

The release build now fails before Gradle packaging if any signing environment
variable is missing or if the configured store file is `android/app/debug.keystore`.

## Permission Intent

The MVP Android app should request only:

- `INTERNET`
- `ACCESS_COARSE_LOCATION`

Do not add precise location, storage, overlay, foreground service, or vibration
permissions unless a shipped user-facing feature requires them.

## Play Console Entries

- Privacy policy: `https://getsovrn.com/privacy`
- Account deletion URL: `https://getsovrn.com/account-deletion`
- App access: provide a reviewer test account or written login instructions.
- Data Safety: disclose account/profile data, stable demographics, device info,
  network/connectivity, coarse location, purchases if enabled, and deletion
  controls.

## Required Manual Verification

- Confirm the built AAB targets the currently required Android API level.
- Confirm release signing uses the upload key, not debug signing.
- In Supabase Auth email templates, include the one-time code token
  (`{{ .Token }}`) so app sign-up users receive a code instead of relying on a
  magic link.
- Test account deletion from the mobile Profile screen.
- Test module permissions and Sync Now on a physical Android device.
- Verify no precise location permission prompt appears.
