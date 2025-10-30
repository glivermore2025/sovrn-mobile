// app.config.ts
import 'dotenv/config';
import { ExpoConfig } from '@expo/config-types';

const config: ExpoConfig = {
  name: 'sovrn-mobile',
  slug: 'sovrn-mobile',
  scheme: 'sovrnmobile',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'dark',
  backgroundColor: '#000000',

  splash: {
    backgroundColor: '#000000',
    image: './assets/splash.png',
    resizeMode: 'contain',
  },

  assetBundlePatterns: ['**/*'],

  extra: {
    // Make sure these exist in .env.local (no quotes, include https://)
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
    router: { origin: 'expo' },
    eas: {
      // optional: add if you plan to use EAS later
      // projectId: 'YOUR-EAS-PROJECT-ID',
    },
  },

  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.sovrn.mobile',
    associatedDomains: [
      'applinks:getsovrn.com',
      'applinks:www.getsovrn.com',
    ],
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
        category: ['BROWSABLE', 'DEFAULT'],
        data: [
          { scheme: 'sovrnmobile' },
          { scheme: 'https', host: 'getsovrn.com' },
          { scheme: 'https', host: 'www.getsovrn.com' },
        ],
      },
    ],
  },

  // no "web" block for now
  plugins: [], // keep empty; add plugins later when needed
};

export default config;
