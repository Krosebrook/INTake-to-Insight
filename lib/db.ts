
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * lib/db.ts
 * Implements a "Local-First" database layer using IndexedDB.
 */

import { Project, DataSource, BrandKit, TeamMember, AuditEntry, Workspace, User } from '../types';

const DB_NAME = 'infogenius_enterprise_db';
const DB_VERSION = 4;
const STORE_PROJECTS = 'projects';
const STORE_SOURCES = 'data_sources';
const STORE_CONFIG = 'config';
const STORE_TEAM = 'team';
const STORE_AUDIT = 'audit';

class LocalDatabase {
  private db: IDBDatabase | null = null;

  constructor() {
    this.init();
  }

  private async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
          const store = db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORE_SOURCES)) {
          db.createObjectStore(STORE_SOURCES, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_CONFIG)) {
          db.createObjectStore(STORE_CONFIG);
        }
        if (!db.objectStoreNames.contains(STORE_TEAM)) {
          db.createObjectStore(STORE_TEAM, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_AUDIT)) {
          const auditStore = db.createObjectStore(STORE_AUDIT, { keyPath: 'id' });
          auditStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  // --- Profile Operations ---
  async getCurrentUser(): Promise<User | undefined> {
    const db = await this.init();
    return new Promise((resolve) => {
      const tx = db.transaction([STORE_CONFIG], 'readonly');
      const req = tx.objectStore(STORE_CONFIG).get('current_user');
      req.onsuccess = () => resolve(req.result);
    });
  }

  async updateCurrentUser(user: User): Promise<void> {
    const db = await this.init();
    return new Promise((resolve) => {
      const tx = db.transaction([STORE_CONFIG], 'readwrite');
      tx.objectStore(STORE_CONFIG).put(user, 'current_user');
      tx.oncomplete = () => resolve();
    });
  }

  // --- Workspace Operations ---

  async getWorkspace(): Promise<Workspace | undefined> {
    const db = await this.init();
    return new Promise((resolve) => {
      const tx = db.transaction([STORE_CONFIG], 'readonly');
      const req = tx.objectStore(STORE_CONFIG).get('workspace');
      req.onsuccess = () => resolve(req.result);
    });
  }

  async updateWorkspace(ws: Workspace): Promise<void> {
    const db = await this.init();
    return new Promise((resolve) => {
      const tx = db.transaction([STORE_CONFIG], 'readwrite');
      tx.objectStore(STORE_CONFIG).put(ws, 'workspace');
      tx.oncomplete = () => resolve();
    });
  }

  // --- Project Operations ---

  async createProject(project: Project): Promise<Project> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_PROJECTS], 'readwrite');
      const store = transaction.objectStore(STORE_PROJECTS);
      const request = store.add(project);
      request.onsuccess = () => resolve(project);
      request.onerror = () => reject(request.error);
    });
  }

  async getProject(id: string): Promise<Project | undefined> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_PROJECTS], 'readonly');
      const store = transaction.objectStore(STORE_PROJECTS);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updateProject(project: Project): Promise<Project> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_PROJECTS], 'readwrite');
      const store = transaction.objectStore(STORE_PROJECTS);
      project.updatedAt = Date.now();
      const request = store.put(project);
      request.onsuccess = () => resolve(project);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllProjects(): Promise<Project[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_PROJECTS], 'readonly');
      const store = transaction.objectStore(STORE_PROJECTS);
      const index = store.index('updatedAt');
      const request = index.openCursor(null, 'prev');
      
      const results: Project[] = [];
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteProject(id: string): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_PROJECTS], 'readwrite');
      const store = transaction.objectStore(STORE_PROJECTS);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // --- Data Source Operations ---

  async addDataSource(source: DataSource): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_SOURCES], 'readwrite');
      const store = transaction.objectStore(STORE_SOURCES);
      const request = store.add(source);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // --- Team Operations ---

  async getTeam(): Promise<TeamMember[]> {
    const db = await this.init();
    return new Promise((resolve) => {
      const tx = db.transaction([STORE_TEAM], 'readonly');
      const req = tx.objectStore(STORE_TEAM).getAll();
      req.onsuccess = () => resolve(req.result);
    });
  }

  async updateMember(member: TeamMember): Promise<void> {
    const db = await this.init();
    return new Promise((resolve) => {
      const tx = db.transaction([STORE_TEAM], 'readwrite');
      tx.objectStore(STORE_TEAM).put(member);
      tx.oncomplete = () => resolve();
    });
  }

  async deleteMember(id: string): Promise<void> {
    const db = await this.init();
    return new Promise((resolve) => {
      const tx = db.transaction([STORE_TEAM], 'readwrite');
      tx.objectStore(STORE_TEAM).delete(id);
      tx.oncomplete = () => resolve();
    });
  }

  // --- Audit Log ---

  async addAuditLog(entry: AuditEntry): Promise<void> {
    const db = await this.init();
    return new Promise((resolve) => {
      const tx = db.transaction([STORE_AUDIT], 'readwrite');
      tx.objectStore(STORE_AUDIT).add(entry);
      tx.oncomplete = () => resolve();
    });
  }

  async getAuditLogs(): Promise<AuditEntry[]> {
    const db = await this.init();
    return new Promise((resolve) => {
      const tx = db.transaction([STORE_AUDIT], 'readonly');
      const index = tx.objectStore(STORE_AUDIT).index('timestamp');
      const req = index.openCursor(null, 'prev');
      const logs: AuditEntry[] = [];
      req.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest).result;
        if (cursor) {
          logs.push(cursor.value);
          cursor.continue();
        } else {
          resolve(logs);
        }
      };
    });
  }

  // --- Brand Kit Operations ---

  async getBrandKit(): Promise<BrandKit | undefined> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_CONFIG], 'readonly');
      const request = tx.objectStore(STORE_CONFIG).get('brand_kit');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updateBrandKit(kit: BrandKit): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_CONFIG], 'readwrite');
      tx.objectStore(STORE_CONFIG).put(kit, 'brand_kit');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

export const db = new LocalDatabase();
