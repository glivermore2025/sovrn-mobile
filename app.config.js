// app.config.js
// Expo CLI loads .env files before evaluating this config. Reading process.env
// here avoids double-loading dotenv and keeps `expo start` output clean.

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

  plugins: ['expo-router', 'expo-secure-store'],

  extra: {
    // these must be strings; empty string is fine if missing
    // NOTE: `router` was removed because the Expo CLI's CORS middleware
    // calls `new URL(extra.router.origin)`. If `router.origin` is set to a
    // non-URL string (for example, 'expo'), it throws `TypeError: Invalid URL`
    // during `expo start`. Reintroduce `router` only with a full URL value.
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
    supabaseAnonKey:
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.EXPO_PUBLIC_SUPABASE_KEY ||
      '',
    purchaseServerUrl: process.env.EXPO_PUBLIC_PURCHASE_SERVER_URL || '',
    siteUrl: process.env.EXPO_PUBLIC_SITE_URL || 'https://getsovrn.com',
  },

  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.sovrn.mobile',
    associatedDomains: ['applinks:getsovrn.com', 'applinks:www.getsovrn.com'],
  },

  android: {
    package: 'com.sovrn.mobile',
    permissions: ['android.permission.INTERNET', 'android.permission.ACCESS_COARSE_LOCATION'],
    blockedPermissions: [
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.SYSTEM_ALERT_WINDOW',
      'android.permission.VIBRATE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
    ],
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
