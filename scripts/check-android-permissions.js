const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
const manifest = fs.readFileSync(manifestPath, 'utf8');

const allowed = new Set([
  'android.permission.ACCESS_COARSE_LOCATION',
  'android.permission.INTERNET',
]);

const sensitiveBlocked = new Set([
  'android.permission.ACCESS_BACKGROUND_LOCATION',
  'android.permission.ACCESS_FINE_LOCATION',
  'android.permission.FOREGROUND_SERVICE',
  'android.permission.READ_EXTERNAL_STORAGE',
  'android.permission.SYSTEM_ALERT_WINDOW',
  'android.permission.VIBRATE',
  'android.permission.WRITE_EXTERNAL_STORAGE',
]);

const declared = [...manifest.matchAll(/<uses-permission[^>]+android:name="([^"]+)"/g)].map((match) => match[1]);
const unexpected = declared.filter((permission) => !allowed.has(permission));
const blocked = declared.filter((permission) => sensitiveBlocked.has(permission));

if (unexpected.length || blocked.length) {
  console.error('Android permission check failed.');
  if (unexpected.length) console.error(`Unexpected permissions: ${unexpected.join(', ')}`);
  if (blocked.length) console.error(`Blocked sensitive permissions: ${blocked.join(', ')}`);
  process.exit(1);
}

console.log(`Android permission check passed: ${declared.join(', ')}`);
