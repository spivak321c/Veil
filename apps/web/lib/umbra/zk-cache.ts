import type {
  ZkAssetLoaderFunction,
  ZkAssetStorerFunction,
  ZkAssetStorageContext,
  ZkAssetData,
  ZkAssetLoadResult,
  ZkAssetStoreResult,
} from "@umbra-privacy/sdk/zk-prover";

const DB_NAME = "veil-zk-cache";
const STORE_NAME = "assets";
const DB_VERSION = 1;

function getCacheKey(context: ZkAssetStorageContext): string {
  return context.variant
    ? `${context.type}-${context.variant}`
    : context.type;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  if (typeof indexedDB === "undefined") {
    return (dbPromise = Promise.reject(
      new Error("indexedDB not available in this environment")
    ));
  }
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

export function getIndexedDbZkAssetLoader(): ZkAssetLoaderFunction {
  return async (context: ZkAssetStorageContext): Promise<ZkAssetLoadResult> => {
    try {
      const db = await openDb();
      const key = getCacheKey(context);
      return await new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const req = tx.objectStore(STORE_NAME).get(key);
        req.onsuccess = () => {
          if (req.result) {
            resolve({ exists: true, data: req.result as ZkAssetData });
          } else {
            resolve({ exists: false });
          }
        };
        req.onerror = () => resolve({ exists: false });
      });
    } catch {
      return { exists: false };
    }
  };
}

export function getIndexedDbZkAssetStorer(): ZkAssetStorerFunction {
  return async (
    data: ZkAssetData,
    context: ZkAssetStorageContext
  ): Promise<ZkAssetStoreResult> => {
    try {
      const db = await openDb();
      const key = getCacheKey(context);
      return await new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const req = tx.objectStore(STORE_NAME).put(data, key);
        req.onsuccess = () => resolve({ success: true });
        req.onerror = () =>
          resolve({
            success: false,
            error: req.error?.message ?? "store failed",
          });
      });
    } catch (e) {
      return { success: false, error: String(e) };
    }
  };
}
