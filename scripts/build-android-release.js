const { spawnSync } = require('child_process');
const path = require('path');
const { loadAndroidReleaseEnv } = require('./android-release-env');

loadAndroidReleaseEnv();

const androidDir = path.join(__dirname, '..', 'android');
const gradleCommand = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';

function getJavaMajorVersion() {
  const result = spawnSync('java', ['-version'], {
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });

  const output = `${result.stderr || ''}\n${result.stdout || ''}`;
  const match = output.match(/version "(\d+)(?:\.(\d+))?/);
  if (!match) return null;

  const first = Number(match[1]);
  const second = Number(match[2]);
  return first === 1 ? second : first;
}

const javaMajorVersion = getJavaMajorVersion();
if (!javaMajorVersion || javaMajorVersion < 17 || javaMajorVersion > 24) {
  console.error(
    `Android release builds require Java 17 through 24. Current Java major version: ${javaMajorVersion || 'unknown'}.`
  );
  console.error('Set JAVA_HOME to a supported JDK, preferably JDK 17, then rerun npm run build:android:release.');
  process.exit(1);
}

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
