const fs = require('fs');
const path = require('path');
const { loadAndroidReleaseEnv } = require('./android-release-env');

loadAndroidReleaseEnv();

const required = [
  'SOVRN_UPLOAD_STORE_FILE',
  'SOVRN_UPLOAD_STORE_PASSWORD',
  'SOVRN_UPLOAD_KEY_ALIAS',
  'SOVRN_UPLOAD_KEY_PASSWORD',
];

const missing = required.filter((name) => !process.env[name]);

if (missing.length) {
  console.error('Android release signing check failed.');
  console.error(`Missing environment variables: ${missing.join(', ')}`);
  console.error('Set all SOVRN_UPLOAD_* variables before building a Play release AAB.');
  process.exit(1);
}

const storeFile = path.resolve(process.env.SOVRN_UPLOAD_STORE_FILE);
const debugStoreFile = path.resolve(__dirname, '..', 'android', 'app', 'debug.keystore');

if (!fs.existsSync(storeFile)) {
  console.error('Android release signing check failed.');
  console.error(`SOVRN_UPLOAD_STORE_FILE does not exist: ${storeFile}`);
  process.exit(1);
}

if (storeFile === debugStoreFile) {
  console.error('Android release signing check failed.');
  console.error('Release builds must not use android/app/debug.keystore.');
  process.exit(1);
}

console.log(`Android release signing check passed for alias "${process.env.SOVRN_UPLOAD_KEY_ALIAS}".`);
