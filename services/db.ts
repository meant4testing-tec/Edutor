
import { Profile, Medicine, Schedule } from '../types';

const DB_NAME = 'MedicineReminderDB';
const DB_VERSION = 1;
const PROFILES_STORE = 'profiles';
const MEDICINES_STORE = 'medicines';
const SCHEDULES_STORE = 'schedules';

let dbInstance: IDBDatabase | null = null;

const getDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    if (!window.indexedDB) {
      const errorMsg = "IndexedDB is not supported in this environment. The application cannot function without local storage.";
      console.error(errorMsg);
      reject(new Error(errorMsg));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB open error:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(PROFILES_STORE)) {
        db.createObjectStore(PROFILES_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(MEDICINES_STORE)) {
        const store = db.createObjectStore(MEDICINES_STORE, { keyPath: 'id' });
        store.createIndex('profileId', 'profileId', { unique: false });
      }
      if (!db.objectStoreNames.contains(SCHEDULES_STORE)) {
        const store = db.createObjectStore(SCHEDULES_STORE, { keyPath: 'id' });
        store.createIndex('medicineId', 'medicineId', { unique: false });
        store.createIndex('profileId', 'profileId', { unique: false });
        store.createIndex('scheduledTime', 'scheduledTime', { unique: false });
      }
    };
  });
};

const makeRequest = <T,>(storeName: string, mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest): Promise<T> => {
  return getDB().then(db => {
    return new Promise<T>((resolve, reject) => {
      const transaction = db.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);
      const request = action(store);

      request.onsuccess = () => {
        resolve(request.result as T);
      };

      request.onerror = () => {
        console.error('DB request error:', request.error);
        reject(request.error);
      };
    });
  });
};


const createDbMethods = <T extends { id: string }>(storeName: string) => ({
  add: (item: T): Promise<IDBValidKey> => makeRequest(storeName, 'readwrite', store => store.add(item)),
  get: (id: string): Promise<T> => makeRequest(storeName, 'readonly', store => store.get(id)),
  getAll: (): Promise<T[]> => makeRequest(storeName, 'readonly', store => store.getAll()),
  update: (item: T): Promise<IDBValidKey> => makeRequest(storeName, 'readwrite', store => store.put(item)),
  delete: (id: string): Promise<void> => makeRequest(storeName, 'readwrite', store => store.delete(id)),
  clear: (): Promise<void> => makeRequest(storeName, 'readwrite', store => store.clear()),
});


const getByIndex = <T,>(storeName: string, indexName: string, query: IDBValidKey | IDBKeyRange): Promise<T[]> => {
    return getDB().then(db => {
        return new Promise<T[]>((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(query);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                console.error('DB getByIndex error:', request.error);
                reject(request.error);
            };
        });
    });
};

export const db = {
  profiles: createDbMethods<Profile>(PROFILES_STORE),
  medicines: {
    ...createDbMethods<Medicine>(MEDICINES_STORE),
    getByProfileId: (profileId: string) => getByIndex<Medicine>(MEDICINES_STORE, 'profileId', profileId)
  },
  schedules: {
    ...createDbMethods<Schedule>(SCHEDULES_STORE),
    getByProfileId: (profileId: string) => getByIndex<Schedule>(SCHEDULES_STORE, 'profileId', profileId),
    getByMedicineId: (medicineId: string) => getByIndex<Schedule>(SCHEDULES_STORE, 'medicineId', medicineId),
    getByDateRange: (profileId: string, startDate: string, endDate: string) => {
        const range = IDBKeyRange.bound(startDate, endDate);
        return getDB().then(db => {
             return new Promise<Schedule[]>((resolve, reject) => {
                const transaction = db.transaction(SCHEDULES_STORE, 'readonly');
                const store = transaction.objectStore(SCHEDULES_STORE);
                const index = store.index('scheduledTime');
                const request = index.getAll(range);

                request.onsuccess = () => {
                    // Filter by profileId client-side as IndexedDB doesn't support multi-index queries easily
                    resolve(request.result.filter(s => s.profileId === profileId));
                };
                request.onerror = () => reject(request.error);
            });
        });
    }
  }
};