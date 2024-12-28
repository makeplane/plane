export abstract class IndexedDBService {
  private dbName: string;
  private version: number;
  private db: IDBDatabase | null = null;

  constructor(dbName: string, version: number) {
    this.dbName = dbName;
    this.version = version;
  }

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains("workspaces")) {
          db.createObjectStore("workspaces", { keyPath: "id" });
        }
      };
    });
  }

  async save(workspaces: any[]): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    const transaction = this.db.transaction("workspaces", "readwrite");
    const store = transaction.objectStore("workspaces");

    return new Promise((resolve, reject) => {
      // Clear existing data
      store.clear();

      // Add new workspaces
      workspaces.forEach((workspace) => {
        store.add(workspace);
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async query(): Promise<any[]> {
    if (!this.db) throw new Error("Database not initialized");

    const transaction = this.db.transaction("workspaces", "readonly");
    const store = transaction.objectStore("workspaces");

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}
