import { createClient } from "@supabase/supabase-js";
import * as aesjs from 'aes-js';
import 'react-native-get-random-values';

// Web-compatible storage using localStorage
class WebSecureStore {
  private storageKey = 'supabase_encryption_keys';

  private getKeys(): Record<string, string> {
    const stored = localStorage.getItem(this.storageKey);
    return stored ? JSON.parse(stored) : {};
  }

  private saveKeys(keys: Record<string, string>) {
    localStorage.setItem(this.storageKey, JSON.stringify(keys));
  }

  private async _encrypt(key: string, value: string) {
    const encryptionKey = crypto.getRandomValues(new Uint8Array(256 / 8));
    const cipher = new aesjs.ModeOfOperation.ctr(encryptionKey, new aesjs.Counter(1));
    const encryptedBytes = cipher.encrypt(aesjs.utils.utf8.toBytes(value));

    const keys = this.getKeys();
    keys[key] = aesjs.utils.hex.fromBytes(encryptionKey);
    this.saveKeys(keys);

    return aesjs.utils.hex.fromBytes(encryptedBytes);
  }

  private async _decrypt(key: string, value: string) {
    const keys = this.getKeys();
    const encryptionKeyHex = keys[key];
    
    if (!encryptionKeyHex) {
      return null;
    }

    const cipher = new aesjs.ModeOfOperation.ctr(
      aesjs.utils.hex.toBytes(encryptionKeyHex),
      new aesjs.Counter(1)
    );
    const decryptedBytes = cipher.decrypt(aesjs.utils.hex.toBytes(value));
    return aesjs.utils.utf8.fromBytes(decryptedBytes);
  }

  async getItem(key: string) {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) {
      return null;
    }

    return await this._decrypt(key, encrypted);
  }

  async removeItem(key: string) {
    localStorage.removeItem(key);
    const keys = this.getKeys();
    delete keys[key];
    this.saveKeys(keys);
  }

  async setItem(key: string, value: string) {
    const encrypted = await this._encrypt(key, value);
    localStorage.setItem(key, encrypted);
  }
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: new WebSecureStore(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export { supabase };

