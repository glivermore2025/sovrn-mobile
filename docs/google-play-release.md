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

Build the Play upload artifact:

```powershell
npm run check:android-permissions
cd android
.\gradlew.bat bundleRelease
```

Upload `android\app\build\outputs\bundle\release\app-release.aab` to Play
Console.

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
- Test account deletion from the mobile Profile screen.
- Test module permissions and Sync Now on a physical Android device.
- Verify no precise location permission prompt appears.
