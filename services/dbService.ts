
import { ProjectTask, BrandProfile } from '../types';

const DB_NAME = 'TVCPlannerDB';
const STORE_NAME = 'projects';
const PROFILE_STORE_NAME = 'brand_profiles';
const DB_VERSION = 2; // Upgraded version

export class DBService {
  private dbPromise: Promise<IDBDatabase>;

  constructor() {
    this.dbPromise = new Promise((resolve, reject) => {
      // Check for support
      if (!('indexedDB' in window)) {
        reject(new Error('IndexedDB not supported'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
        
        // NEW: Brand Profiles Store
        if (!db.objectStoreNames.contains(PROFILE_STORE_NAME)) {
          db.createObjectStore(PROFILE_STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        resolve((event.target as IDBOpenDBRequest).result);
      };

      request.onerror = (event) => {
        console.error("IndexedDB error:", (event.target as IDBOpenDBRequest).error);
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }

  // --- PROJECTS ---
  async getAllProjects(): Promise<ProjectTask[]> {
    try {
      const db = await this.dbPromise;
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error("Error getting all projects:", error);
      return [];
    }
  }

  async saveProject(project: ProjectTask): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(project); 

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteProject(id: string): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // --- BRAND PROFILES ---
  async getAllProfiles(): Promise<BrandProfile[]> {
    try {
      const db = await this.dbPromise;
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(PROFILE_STORE_NAME, 'readonly');
        const store = transaction.objectStore(PROFILE_STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (error) { return []; }
  }

  async saveProfile(profile: BrandProfile): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(PROFILE_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(PROFILE_STORE_NAME);
      const request = store.put(profile);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteProfile(id: string): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(PROFILE_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(PROFILE_STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearAll(): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
        const t1 = db.transaction(STORE_NAME, 'readwrite');
        t1.objectStore(STORE_NAME).clear();
        const t2 = db.transaction(PROFILE_STORE_NAME, 'readwrite');
        t2.objectStore(PROFILE_STORE_NAME).clear();
        resolve();
    });
  }
}

export const dbService = new DBService();