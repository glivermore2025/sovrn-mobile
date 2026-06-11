const { spawnSync } = require('child_process');
const path = require('path');
const { loadAndroidReleaseEnv } = require('./android-release-env');

loadAndroidReleaseEnv();

const androidDir = path.join(__dirname, '..', 'android');
const gradleCommand = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';

const result = spawnSync(gradleCommand, ['bundleRelease'], {
  cwd: androidDir,
  env: process.env,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
