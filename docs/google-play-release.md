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
`.env.release-signing.local` file when it exists.

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
