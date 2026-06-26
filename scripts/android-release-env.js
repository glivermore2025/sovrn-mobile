const fs = require('fs');
const path = require('path');

const releaseEnvPath = path.join(__dirname, '..', 'release-signing.local');

function loadAndroidReleaseEnv() {
  if (!fs.existsSync(releaseEnvPath)) return;

  const lines = fs.readFileSync(releaseEnvPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separator = trimmed.indexOf('=');
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^[`'"]|[`'"]$/g, '');

    if (key && !process.env[key]) {
      process.env[key] = value;
    }
  }
}

module.exports = { loadAndroidReleaseEnv, releaseEnvPath };
