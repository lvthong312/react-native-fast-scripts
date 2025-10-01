// generate-script.js
import fs from 'fs';
import path from 'path';

// ================================
// ⚡ Project Root & Args Handling
// ================================
const args = process.argv.slice(2);

// Default output directory = project root
let OUTPUT_DIR = process.cwd();

// Check for --dir argument
const dirIndex = args.findIndex(arg => arg.startsWith('--dir'));
if (dirIndex !== -1) {
  const dirArg = args[dirIndex].split('=')[1] || args[dirIndex + 1];
  if (dirArg) {
    // Replace '@' with '.' to resolve project-relative path
    OUTPUT_DIR = path.resolve(process.cwd(), dirArg.replace(/^@/, '.'));
    args.splice(dirIndex, 2);
  }
}

// Remaining args = theme modes
if (args.length === 0) {
  console.error(
    '❌ Please provide at least one theme mode, e.g. --asyncstorage --mmkv',
  );
  process.exit(1);
}

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}


// ======== Cấu hình ========
const KEYS_FILE = path.join(OUTPUT_DIR, 'keys.ts');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'storage.ts');
const OUTPUT_FILE_MMKV = path.join(OUTPUT_DIR, 'mmkv-storage.ts');

// 2. Tạo keys.ts nếu chưa có
if (!fs.existsSync(KEYS_FILE)) {
  const defaultKeys = `
// ================================
// 🔑 Storage Keys Configuration
// This file defines all storage keys used in StorageService / MMKVService.
// ================================
//
// Developers can add new keys and their corresponding value types here.
//

export interface IStorage {
  UserName: string;
  RefetchIntervalConfig: number;
}
`;
  fs.writeFileSync(KEYS_FILE, defaultKeys, 'utf-8');
  console.log(`📝 Created default keys.ts at ${KEYS_FILE}`);
}

// ======== Đọc keys.ts ========
const keysContent = fs.readFileSync(KEYS_FILE, 'utf-8');

// Regex lấy phần trong interface IStorage { ... }
const match = keysContent.match(/interface\s+IStorage\s*{([^}]*)}/);
if (!match) {
  console.error('❌ Không tìm thấy interface IStorage trong keys.ts');
  process.exit(1);
}

function generateAsyncStorage() {
  // ======== Generate StorageService ========
  const storageService = `
// ================================
// 🚀 Auto-generated file - DO NOT EDIT
// ================================
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback } from 'react';
import { IStorage } from './keys';
export type StorageKey = keyof IStorage;

export type StorageValueMap = {
    [K in keyof IStorage]: IStorage[K];
};
export class StorageService {
    // Lưu 1 item
    /**
     * Example:
     * await StorageService.setItem(StorageKey.UserName, "Alice");
     * await StorageService.setItem(StorageKey.RefetchIntervalConfig, { interval: 5000 });
     */
    static async setItem<K extends StorageKey>(key: K, value: StorageValueMap[K]): Promise<void> {
        try {
            const jsonValue = JSON.stringify(value);
            await AsyncStorage.setItem(key, jsonValue);
        } catch (error) {
            console.error('AsyncStorage setItem error:', error);
        }
    }


    // Lấy 1 item
    /**
     * Example:
     * const userName = await StorageService.getItem(StorageKey.UserName);
     * console.log(userName); // "Alice"
     */
    static async getItem<K extends StorageKey>(key: K): Promise<StorageValueMap[K] | null> {
        try {
            const jsonValue = await AsyncStorage.getItem(key);
            return jsonValue != null ? (JSON.parse(jsonValue) as StorageValueMap[K]) : null;
        } catch (error) {
            console.error('AsyncStorage getItem error:', error);
            return null;
        }
    }


    // Xóa 1 item
    /**
    * Example:
    * await StorageService.removeItem(StorageKey.UserName);
    */
    static async removeItem<K extends StorageKey>(key: K): Promise<void> {
        try {
            await AsyncStorage.removeItem(key);
        } catch (error) {
            console.error('AsyncStorage removeItem error:', error);
        }
    }


    // ================================
    // 🔥 Batch methods
    // ================================

    // Lưu nhiều item 1 lần
    /**
    * Example:
    * await StorageService.setItems({
    *   UserName: "Bob",
    *   RefetchIntervalConfig: { interval: 3000 },
    * });
    */
    static async setItems(values: { [K in StorageKey]?: StorageValueMap[K] }): Promise<void> {
        try {
            const entries = Object.entries(values).map(([key, value]) => [
                key,
                JSON.stringify(value),
            ]);
            await AsyncStorage.multiSet(entries as any);
        } catch (error) {
            console.error('AsyncStorage setItems error:', error);
        }
    }

    // Lấy nhiều item 1 lần
    /**
     * Example:
     * const values = await StorageService.getItems([StorageKey.UserName, StorageKey.RefetchIntervalConfig]);
     * console.log(values.UserName); // "Bob"
     * console.log(values.RefetchIntervalConfig?.interval); // 3000
     */
    static async getItems<K extends StorageKey>(
        keys: K[]
    ): Promise<Partial<{ [P in K]: StorageValueMap[P] }>> {
        try {
            const result: Partial<{ [P in K]: StorageValueMap[P] }> = {};
            const entries = await AsyncStorage.multiGet(keys);
            entries.forEach(([key, value]) => {
                if (value != null) {
                    result[key as K] = JSON.parse(value) as StorageValueMap[K];
                }
            });
            return result;
        } catch (error) {
            console.error('AsyncStorage getItems error:', error);
            return {};
        }
    }


    // Xóa nhiều item 1 lần
    /**
    * Example:
    * await StorageService.removeItems([StorageKey.UserName, StorageKey.RefetchIntervalConfig]);
    */
    static async removeItems(keys: StorageKey[]): Promise<void> {
        try {
            await AsyncStorage.multiRemove(keys);
        } catch (error) {
            console.error('AsyncStorage removeItems error:', error);
        }
    }


    // Xóa toàn bộ
    /**
     * Example:
     * await StorageService.clear(); // ⚠️ Xóa sạch tất cả dữ liệu
     */
    static async clear(): Promise<void> {
        try {
            await AsyncStorage.clear();
        } catch (error) {
            console.error('AsyncStorage clear error:', error);
        }
    }

}

// ================================
// React Hook
// ================================
/**
 * Example (React Hook):
 * 
 * function Profile() {
 *   const { value: username, setValue: setUsername, loading } =
 *       useAsyncStorage(StorageKey.UserName, "");
 * 
 *   if (loading) return <Text>Loading...</Text>;
 * 
 *   return (
 *     <View>
 *       <Text>Hi {username}</Text>
 *       <Button title="Change Name" onPress={() => setUsername("Charlie")} />
 *     </View>
 *   );
 * }
 */
export function useStorage<K extends StorageKey>(
    key: K,
    initialValue: StorageValueMap[K]
) {
    const [value, setValue] = useState(initialValue);
    const [loading, setLoading] = useState(true);

    // Load giá trị khi mount
    useEffect(() => {
        const loadValue = async () => {
            const storedValue = await StorageService.getItem(key);
            if (storedValue !== null) {
                setValue(storedValue);
            }
            setLoading(false);
        };
        loadValue();
    }, [key]);

    // Set state + AsyncStorage
    const setStoredValue = useCallback(
        async (
            newValue:
                | StorageValueMap[K]
                | ((prev: StorageValueMap[K]) => StorageValueMap[K])
        ) => {
            const valueToStore =
                typeof newValue === 'function'
                    ? (newValue as (prev: StorageValueMap[K]) => StorageValueMap[K])(value)
                    : newValue;

            setValue(valueToStore);
            await StorageService.setItem(key, valueToStore);
        },
        [key, value]
    );

    const remove = useCallback(async () => {
        setValue(initialValue);
        await StorageService.removeItem(key);
    }, [key, initialValue]);

    return { value, setValue: setStoredValue, remove, loading };
}
`;

  // ======== Ghi ra file ========
  fs.writeFileSync(OUTPUT_FILE, storageService, 'utf-8');

  console.log(`✅ Generated ${OUTPUT_FILE}`);
}

function generateMMKVStorage() {
  // ======== Generate StorageService ========
  const storageService = `
// ================================
// 🚀 Auto-generated file - DO NOT EDIT
// ================================
import { MMKV } from 'react-native-mmkv';
import { useState, useEffect, useCallback } from 'react';
import { IStorage } from './keys';

export type StorageKey = keyof IStorage;

export type StorageValueMap = {
  [K in keyof IStorage]: IStorage[K];
};

// Tạo instance MMKV
const storage = new MMKV();

export class MMKVService {
  // ================================
  // 🔹 Single methods
  // ================================

  /**
   * Lưu 1 item
   *
   * Example:
   * MMKVService.setItem("UserName", "Alice");
   * MMKVService.setItem("RefetchIntervalConfig", { interval: 5000 });
   */
  static setItem<K extends StorageKey>(key: K, value: StorageValueMap[K]): void {
    try {
      const jsonValue = JSON.stringify(value);
      storage.set(key, jsonValue);
    } catch (error) {
      console.error('MMKV setItem error:', error);
    }
  }

  /**
   * Lấy 1 item
   *
   * Example:
   * const userName = MMKVService.getItem("UserName");
   * console.log(userName); // "Alice"
   * const config = MMKVService.getItem("RefetchIntervalConfig");
   * console.log(config?.interval); // 5000
   */
  static getItem<K extends StorageKey>(key: K): StorageValueMap[K] | null {
    try {
      const jsonValue = storage.getString(key);
      return jsonValue != null ? (JSON.parse(jsonValue) as StorageValueMap[K]) : null;
    } catch (error) {
      console.error('MMKV getItem error:', error);
      return null;
    }
  }

  /**
   * Xóa 1 item
   *
   * Example:
   * MMKVService.removeItem("UserName");
   */
  static removeItem<K extends StorageKey>(key: K): void {
    try {
      storage.delete(key);
    } catch (error) {
      console.error('MMKV removeItem error:', error);
    }
  }

  // ================================
  // 🔥 Batch methods
  // ================================

  /**
   * Lưu nhiều item 1 lần
   *
   * Example:
   * MMKVService.setItems({
   *   UserName: "Bob",
   *   RefetchIntervalConfig: { interval: 3000 },
   * });
   */
  static setItems(values: { [K in StorageKey]?: StorageValueMap[K] }): void {
    try {
      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined) {
          storage.set(key, JSON.stringify(value));
        }
      });
    } catch (error) {
      console.error('MMKV setItems error:', error);
    }
  }

  /**
   * Lấy nhiều item 1 lần
   *
   * Example:
   * const values = MMKVService.getItems(["UserName", "RefetchIntervalConfig"]);
   * console.log(values.UserName); // "Bob"
   * console.log(values.RefetchIntervalConfig?.interval); // 3000
   */
  static getItems<K extends StorageKey>(
    keys: K[],
  ): Partial<{ [P in K]: StorageValueMap[P] }> {
    try {
      const result: Partial<{ [P in K]: StorageValueMap[P] }> = {};
      keys.forEach(key => {
        const jsonValue = storage.getString(key);
        if (jsonValue != null) {
          result[key] = JSON.parse(jsonValue) as StorageValueMap[K];
        }
      });
      return result;
    } catch (error) {
      console.error('MMKV getItems error:', error);
      return {};
    }
  }

  /**
   * Xóa nhiều item 1 lần
   *
   * Example:
   * MMKVService.removeItems(["UserName", "RefetchIntervalConfig"]);
   */
  static removeItems(keys: StorageKey[]): void {
    try {
      keys.forEach(key => storage.delete(key));
    } catch (error) {
      console.error('MMKV removeItems error:', error);
    }
  }

  /**
   * Xóa toàn bộ
   *
   * ⚠️ Cẩn thận: sẽ xóa sạch tất cả dữ liệu trong storage
   *
   * Example:
   * MMKVService.clear();
   */
  static clear(): void {
    try {
      storage.clearAll();
    } catch (error) {
      console.error('MMKV clear error:', error);
    }
  }
}

// ================================
// React Hook
// ================================
/**
 * React Hook: useStorage
 *
 * Example:
 * function Profile() {
 *   const { value: username, setValue: setUsername, remove } =
 *     useStorage("UserName", "");
 *
 *   return (
 *     <View>
 *       <Text>Hi {username}</Text>
 *       <Button title="Change" onPress={() => setUsername("Charlie")} />
 *       <Button title="Clear" onPress={remove} />
 *     </View>
 *   );
 * }
 */
export function useStorage<K extends StorageKey>(
  key: K,
  initialValue: StorageValueMap[K],
) {
  const [value, setValue] = useState<StorageValueMap[K]>(initialValue);

  // Load giá trị khi mount
  useEffect(() => {
    const storedValue = MMKVService.getItem(key);
    if (storedValue !== null) {
      setValue(storedValue);
    }
  }, [key]);

  // Set state + MMKV
  const setStoredValue = useCallback(
    (
      newValue:
        | StorageValueMap[K]
        | ((prev: StorageValueMap[K]) => StorageValueMap[K]),
    ) => {
      const valueToStore =
        typeof newValue === 'function'
          ? (newValue as (prev: StorageValueMap[K]) => StorageValueMap[K])(value)
          : newValue;

      setValue(valueToStore);
      MMKVService.setItem(key, valueToStore);
    },
    [key, value],
  );

  const remove = useCallback(() => {
    setValue(initialValue);
    MMKVService.removeItem(key);
  }, [key, initialValue]);

  return { value, setValue: setStoredValue, remove };
}
`;

  // ======== Ghi ra file ========
  fs.writeFileSync(OUTPUT_FILE_MMKV, storageService, 'utf-8');

  console.log(`✅ Generated ${OUTPUT_FILE}`);
}
if (process.argv.includes('--asyncstorage')) {
  generateAsyncStorage();
}
if (process.argv.includes('--mmkv')) {
  generateMMKVStorage();
}
