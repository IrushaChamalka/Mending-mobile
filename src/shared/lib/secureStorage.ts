import * as SecureStore from 'expo-secure-store';

/**
 * Auth tokens, and nothing else, live in the device keychain/keystore (brief §5 and §12). Tokens
 * never go to MMKV, persisted state or logs.
 */
const ACCESS_TOKEN_KEY = 'stitchflow.auth.accessToken';

const OPTIONS: SecureStore.SecureStoreOptions = {
  // Readable once the phone has been unlocked after boot; never migrated to another device.
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

export function readAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY, OPTIONS);
}

export function writeAccessToken(token: string): Promise<void> {
  return SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token, OPTIONS);
}

export function deleteAccessToken(): Promise<void> {
  return SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY, OPTIONS);
}
