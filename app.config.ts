import 'dotenv/config';
import { ExpoConfig } from '@expo/config';

const config: ExpoConfig = {
  name: "sovrn-mobile",
  slug: "sovrn-mobile",
  scheme: "sovrnmobile",
  version: "1.0.0",
  orientation: "portrait",
  sdkVersion: "53.0.0",
  platforms: ["ios", "android", "web"],
  backgroundColor: "#000000",
  primaryColor: "#000000",
  userInterfaceStyle: "dark",

  splash: {
    backgroundColor: "#000000",
    image: "./assets/splash.png",
    resizeMode: "contain",
  },

  updates: {
    fallbackToCacheTimeout: 0,
  },

  assetBundlePatterns: ["**/*"],

  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    router: {
      origin: "expo",
    },
  },

  ios: {
    supportsTablet: false,
    bundleIdentifier: "com.sovrn.mobile",
    associatedDomains: [
      "applinks:getsovrn.com",
      "applinks:www.getsovrn.com",
    ],
  },

  android: {
    package: "com.sovrn.mobile",
    adaptiveIcon: {
      foregroundImage: "./assets/icon.png",
      backgroundColor: "#000000",
    },
    intentFilters: [
      {
        action: "VIEW",
        data: [
          { scheme: "sovrnmobile" },
          { scheme: "https", host: "getsovrn.com" },
          { scheme: "https", host: "www.getsovrn.com" }
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },

  web: {
    bundler: "metro",
    output: "static",
  },
};

export default config;
