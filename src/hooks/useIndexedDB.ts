// hooks/useIndexedDB.ts
import { useState, useEffect, useCallback, useRef } from 'react';

interface DBConfig {
  name: string;
  version: number;
  stores: {
    [key: string]: string[];
  };
}

const DB_CONFIG: DBConfig = {
  name: 'taskManagerDB',
  version: 1,
  stores: {
    tasks: ['id', 'text', 'category', 'priority', 'dueDate', 'createdAt', 'completed']
  }
};

export function useIndexedDB<T>(storeName: string) {
  const dbRef = useRef<IDBDatabase | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize database
  useEffect(() => {
    let mounted = true;

    const initDB = () => {
      const request = indexedDB.open(DB_CONFIG.name, DB_CONFIG.version);

      request.onerror = (event) => {
        const target = event.target as IDBOpenDBRequest;
        if (mounted) {
          setError(`Database error: ${target.error?.message}`);
          setIsInitialized(true);
        }
      };

      request.onsuccess = (event) => {
        const target = event.target as IDBOpenDBRequest;
        if (mounted) {
          dbRef.current = target.result;
          setIsInitialized(true);
          setError(null);

          // Listen for close events
          dbRef.current.onclose = () => {
            if (mounted) {
              dbRef.current = null;
              initDB(); // Reinitialize when connection closes
            }
          };

          dbRef.current.onversionchange = () => {
            if (dbRef.current) {
              dbRef.current.close();
              if (mounted) {
                dbRef.current = null;
                initDB(); // Reinitialize when version changes
              }
            }
          };
        }
      };

      request.onupgradeneeded = (event) => {
        const target = event.target as IDBOpenDBRequest;
        const database = target.result;

        Object.entries(DB_CONFIG.stores).forEach(([store, indexes]) => {
          if (!database.objectStoreNames.contains(store)) {
            const objectStore = database.createObjectStore(store, {
              keyPath: 'id',
              autoIncrement: true
            });

            indexes.forEach(index => {
              if (index !== 'id') {
                objectStore.createIndex(index, index);
              }
            });
          }
        });
      };
    };

    initDB();

    return () => {
      mounted = false;
      if (dbRef.current) {
        dbRef.current.close();
        dbRef.current = null;
      }
    };
  }, []);

  const ensureConnection = useCallback(async (): Promise<IDBDatabase> => {
    if (dbRef.current) return dbRef.current;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_CONFIG.name, DB_CONFIG.version);

      request.onerror = () => {
        reject(new Error('Failed to open database'));
      };

      request.onsuccess = (event) => {
        const target = event.target as IDBOpenDBRequest;
        dbRef.current = target.result;
        resolve(target.result);
      };
    });
  }, []);

  const add = useCallback(async (data: Omit<T, 'id'>): Promise<T> => {
    try {
      const db = await ensureConnection();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.add({ ...data, createdAt: new Date().toISOString() });

        request.onsuccess = () => {
          resolve({ ...data, id: request.result } as T);
        };

        request.onerror = () => {
          reject(request.error);
        };

        transaction.oncomplete = () => {
          // Optional: Handle transaction completion
        };

        transaction.onerror = () => {
          reject(transaction.error);
        };
      });
    } catch (err) {
      throw new Error(`Failed to add item: ${err}`);
    }
  }, [storeName, ensureConnection]);

  const getAll = useCallback(async (): Promise<T[]> => {
    try {
      const db = await ensureConnection();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    } catch (err) {
      throw new Error(`Failed to get items: ${err}`);
    }
  }, [storeName, ensureConnection]);

  const update = useCallback(async (id: number, data: Partial<T>): Promise<T> => {
    try {
      const db = await ensureConnection();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const getRequest = store.get(id);

        getRequest.onsuccess = () => {
          const updatedData = { ...getRequest.result, ...data };
          const updateRequest = store.put(updatedData);

          updateRequest.onsuccess = () => {
            resolve(updatedData as T);
          };

          updateRequest.onerror = () => {
            reject(updateRequest.error);
          };
        };

        getRequest.onerror = () => {
          reject(getRequest.error);
        };
      });
    } catch (err) {
      throw new Error(`Failed to update item: ${err}`);
    }
  }, [storeName, ensureConnection]);

  const remove = useCallback(async (id: number): Promise<void> => {
    try {
      const db = await ensureConnection();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    } catch (err) {
      throw new Error(`Failed to delete item: ${err}`);
    }
  }, [storeName, ensureConnection]);

  return {
    add,
    getAll,
    update,
    remove,
    error,
    isInitialized
  };
}