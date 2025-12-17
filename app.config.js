// app.config.js
const { config } = require('dotenv');

// Load .env.local first; fall back to .env if needed
config({ path: '.env.local' });
config();

module.exports = {
  name: 'sovrn-mobile',
  slug: 'sovrn-mobile',
  scheme: 'sovrnmobile',
  version: '1.0.0',
  orientation: 'portrait',
  sdkVersion: '53.0.0',
  platforms: ['ios', 'android', 'web'],
  backgroundColor: '#000000',
  primaryColor: '#000000',
  userInterfaceStyle: 'dark',

  splash: {
    backgroundColor: '#000000',
    image: './assets/splash.png',
    resizeMode: 'contain',
  },

  updates: {
    fallbackToCacheTimeout: 0,
  },

  assetBundlePatterns: ['**/*'],

  // Added on install: register native plugin for secure storage
  plugins: ['expo-secure-store'],

  extra: {
    // these must be strings; empty string is fine if missing
    // NOTE: `router` was removed because the Expo CLI's CORS middleware
    // calls `new URL(extra.router.origin)`. If `router.origin` is set to a
    // non-URL string (for example, 'expo'), it throws `TypeError: Invalid URL`
    // during `expo start`. Reintroduce `router` only with a full URL value.
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_KEY || '',
  },

  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.sovrn.mobile',
    associatedDomains: ['applinks:getsovrn.com', 'applinks:www.getsovrn.com'],
  },

  android: {
    package: 'com.sovrn.mobile',
    adaptiveIcon: {
      foregroundImage: './assets/icon.png',
      backgroundColor: '#000000',
    },
    intentFilters: [
      {
        action: 'VIEW',
        data: [
          { scheme: 'sovrnmobile' },
          { scheme: 'https', host: 'getsovrn.com' },
          { scheme: 'https', host: 'www.getsovrn.com' },
        ],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
  },

  web: {
    bundler: 'metro',
    output: 'static',
  },
};
