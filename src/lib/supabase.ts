import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const env = process.env;
const supabaseUrl =
  env.EXPO_PUBLIC_SUPABASE_URL ?? Constants.expoConfig?.extra?.supabaseUrl ?? '';
const supabaseAnonKey =
  env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  env.EXPO_PUBLIC_SUPABASE_KEY ??
  Constants.expoConfig?.extra?.supabaseAnonKey ?? '';
const SECURE_STORE_CHUNK_SIZE = 1800;
const chunkCountKey = (key: string) => `${key}.chunks`;
const chunkKey = (key: string, index: number) => `${key}.chunk.${index}`;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase config: set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_KEY (or EXPO_PUBLIC_SUPABASE_ANON_KEY), e.g. in .env.local or app.config.js extras.'
  );
}

async function deleteChunkedItem(key: string) {
  const chunkCount = Number(await SecureStore.getItemAsync(chunkCountKey(key)));
  if (Number.isFinite(chunkCount) && chunkCount > 0) {
    await Promise.all(
      Array.from({ length: chunkCount }, (_, index) =>
        SecureStore.deleteItemAsync(chunkKey(key, index)),
      ),
    );
  }

  await SecureStore.deleteItemAsync(chunkCountKey(key));
  await SecureStore.deleteItemAsync(key);
}

const ExpoSecureStoreAdapter = {
  getItem: async (key: string) => {
    const chunkCount = Number(await SecureStore.getItemAsync(chunkCountKey(key)));
    if (!Number.isFinite(chunkCount) || chunkCount <= 0) {
      return SecureStore.getItemAsync(key);
    }

    const chunks = await Promise.all(
      Array.from({ length: chunkCount }, (_, index) =>
        SecureStore.getItemAsync(chunkKey(key, index)),
      ),
    );

    if (chunks.some((chunk) => chunk == null)) {
      await deleteChunkedItem(key);
      return null;
    }

    return chunks.map((chunk) => chunk ?? '').join('');
  },
  setItem: async (key: string, value: string) => {
    await deleteChunkedItem(key);

    if (value.length <= SECURE_STORE_CHUNK_SIZE) {
      await SecureStore.setItemAsync(key, value);
      return;
    }

    const chunks = value.match(new RegExp(`.{1,${SECURE_STORE_CHUNK_SIZE}}`, 'g')) ?? [];
    await Promise.all(
      chunks.map((chunk, index) =>
        SecureStore.setItemAsync(chunkKey(key, index), chunk),
      ),
    );
    await SecureStore.setItemAsync(chunkCountKey(key), String(chunks.length));
  },
  removeItem: async (key: string) => {
    await deleteChunkedItem(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // IMPORTANT for React Native
  },
});
