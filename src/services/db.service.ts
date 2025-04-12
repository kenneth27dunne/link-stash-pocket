import { Capacitor } from '@capacitor/core';
import { SQLiteConnection, SQLiteDBConnection, CapacitorSQLite } from '@capacitor-community/sqlite';

export interface Category {
  id?: number;
  name: string;
  icon: string;
  color?: string;
  description?: string;
  createdAt?: string;
}

export interface Link {
  id?: number;
  url: string;
  title?: string;
  description?: string;
  thumbnail?: string;
  favicon?: string;
  categoryId: number;
  type: 'image' | 'video' | 'file' | 'other';
  createdAt?: string;
}

interface StorageInterface {
  initialize(): Promise<void>;
  init(): Promise<void>;
  getCategories(): Promise<Category[]>;
  addCategory(category: Omit<Category, 'id'>): Promise<number>;
  getLinksByCategory(categoryId: number): Promise<Link[]>;
  getAllLinks(): Promise<Link[]>;
  addLink(link: Omit<Link, 'id'>): Promise<number>;
  deleteLink(id: number): Promise<boolean>;
  deleteCategory(id: number): Promise<boolean>;
  updateCategory(category: Category): Promise<boolean>;
  updateLink(link: Link): Promise<boolean>;
}

class WebStorageFallback implements StorageInterface {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;
  }

  async init(): Promise<void> {
    await this.initialize();
  }

  get isWebFallback(): boolean {
    return true;
  }

  get db(): any {
    return this;
  }

  private getItem(key: string): any {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  }

  private setItem(key: string, value: any): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  async getCategories(): Promise<Category[]> {
    return this.getItem('categories') || [];
  }

  async addCategory(category: Omit<Category, 'id'>): Promise<number> {
    const categories = await this.getCategories();
    const newId = categories.length > 0 ? Math.max(...categories.map(c => c.id)) + 1 : 1;
    const newCategory = { ...category, id: newId };
    categories.push(newCategory);
    this.setItem('categories', categories);
    return newId;
  }

  async getLinksByCategory(categoryId: number): Promise<Link[]> {
    const links = await this.getAllLinks();
    return links.filter(link => link.categoryId === categoryId);
  }

  async getAllLinks(): Promise<Link[]> {
    return this.getItem('links') || [];
  }

  async addLink(link: Omit<Link, 'id'>): Promise<number> {
    const links = await this.getAllLinks();
    const newId = links.length > 0 ? Math.max(...links.map(l => l.id)) + 1 : 1;
    const newLink = { ...link, id: newId, createdAt: new Date().toISOString() };
    links.push(newLink);
    this.setItem('links', links);
    return newId;
  }

  async deleteLink(id: number): Promise<boolean> {
    const links = await this.getAllLinks();
    const filteredLinks = links.filter(link => link.id !== id);
    if (filteredLinks.length < links.length) {
      this.setItem('links', filteredLinks);
      return true;
    }
    return false;
  }

  async deleteCategory(id: number): Promise<boolean> {
    const categories = await this.getCategories();
    const filteredCategories = categories.filter(category => category.id !== id);
    if (filteredCategories.length < categories.length) {
      this.setItem('categories', filteredCategories);
      // Also delete links in this category
      const links = await this.getAllLinks();
      const filteredLinks = links.filter(link => link.categoryId !== id);
      this.setItem('links', filteredLinks);
      return true;
    }
    return false;
  }

  async updateCategory(category: Category): Promise<boolean> {
    const categories = await this.getCategories();
    const index = categories.findIndex(c => c.id === category.id);
    if (index === -1) return false;
    categories[index] = category;
    this.setItem('categories', categories);
    return true;
  }

  async updateLink(link: Link): Promise<boolean> {
    const links = await this.getAllLinks();
    const index = links.findIndex(l => l.id === link.id);
    if (index === -1) return false;
    links[index] = link;
    this.setItem('links', links);
    return true;
  }
}

class SQLiteStorage implements StorageInterface {
  private db: SQLiteDBConnection;
  private initialized = false;

  constructor(db: SQLiteDBConnection) {
    this.db = db;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;
  }

  async init(): Promise<void> {
    await this.initialize();
  }

  async getCategories(): Promise<Category[]> {
    const result = await this.db.query('SELECT * FROM categories ORDER BY id ASC');
    return result.values || [];
  }

  async addCategory(category: Omit<Category, 'id'>): Promise<number> {
    const result = await this.db.run(
      'INSERT INTO categories (name, icon, color, description) VALUES (?, ?, ?, ?)',
      [category.name, category.icon, category.color || null, category.description || null]
    );
    return result.changes?.lastId || 0;
  }

  async getLinksByCategory(categoryId: number): Promise<Link[]> {
    const result = await this.db.query(
      'SELECT * FROM links WHERE categoryId = ? ORDER BY id DESC',
      [categoryId]
    );
    return result.values || [];
  }

  async getAllLinks(): Promise<Link[]> {
    const result = await this.db.query('SELECT * FROM links ORDER BY id DESC');
    return result.values || [];
  }

  async addLink(link: Omit<Link, 'id'>): Promise<number> {
    const result = await this.db.run(
      'INSERT INTO links (url, title, description, thumbnail, favicon, categoryId, type) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [link.url, link.title || null, link.description || null, link.thumbnail || null, link.favicon || null, link.categoryId, link.type]
    );
    return result.changes?.lastId || 0;
  }

  async deleteLink(id: number): Promise<boolean> {
    const result = await this.db.run('DELETE FROM links WHERE id = ?', [id]);
    return result.changes?.changes > 0;
  }

  async deleteCategory(id: number): Promise<boolean> {
    const result = await this.db.run('DELETE FROM categories WHERE id = ?', [id]);
    return result.changes?.changes > 0;
  }

  async updateCategory(category: Category): Promise<boolean> {
    const result = await this.db.run(
      'UPDATE categories SET name = ?, icon = ?, color = ?, description = ? WHERE id = ?',
      [category.name, category.icon, category.color || null, category.description || null, category.id]
    );
    return result.changes?.changes > 0;
  }

  async updateLink(link: Link): Promise<boolean> {
    const result = await this.db.run(
      'UPDATE links SET url = ?, title = ?, description = ?, thumbnail = ?, favicon = ?, categoryId = ?, type = ? WHERE id = ?',
      [link.url, link.title || null, link.description || null, link.thumbnail || null, link.favicon || null, link.categoryId, link.type, link.id]
    );
    return result.changes?.changes > 0;
  }

  async closeConnection(): Promise<void> {
    await this.db.close();
  }
}

export class DatabaseService {
  private storage: StorageInterface | null = null;
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;
  private sqlite: SQLiteConnection;
  public isWebFallback = false;
  
  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    
    this.initializationPromise = (async () => {
      try {
        // Check if we're in a web environment
        const platform = Capacitor.getPlatform();
        
        if (platform === 'web') {
          // For web, we need to initialize the jeep-sqlite element
          const jeepSqliteEl = document.querySelector('jeep-sqlite');
          if (!jeepSqliteEl) {
            console.warn('jeep-sqlite element not found, falling back to web storage');
            this.storage = new WebStorageFallback();
            await this.storage.init();
            this.initialized = true;
            this.isWebFallback = true;
            return;
          }
          
          // Initialize the web platform with timeout
          try {
            await Promise.race([
              this.sqlite.initWebStore(),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Web store initialization timed out')), 5000)
              )
            ]);
          } catch (error) {
            console.warn('Web store initialization failed, falling back to web storage:', error);
            this.storage = new WebStorageFallback();
            await this.storage.init();
            this.initialized = true;
            this.isWebFallback = true;
            return;
          }
        }
        
        // Try to connect to SQLite with timeout
        try {
          const platformResult = await Promise.race([
            this.sqlite.checkConnectionsConsistency(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Connection check timed out')), 5000)
            )
          ]) as { result: boolean };
          
          const isConnectionResult = await Promise.race([
            this.sqlite.isConnection('linkstash', false),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Connection check timed out')), 5000)
            )
          ]) as { result: boolean };
          
          if (platformResult.result && isConnectionResult.result) {
            const db = await Promise.race([
              this.sqlite.retrieveConnection('linkstash', false),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Connection retrieval timed out')), 5000)
              )
            ]) as SQLiteDBConnection;
            
            if (db) {
              this.storage = new SQLiteStorage(db);
              await this.storage.init();
              this.initialized = true;
              console.log('SQLite storage initialized successfully');
              return;
            }
          }
          
          // If we get here, we need to create a new connection
          const db = await Promise.race([
            this.sqlite.createConnection(
              'linkstash',
              false,
              'no-encryption',
              1,
              false
            ),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Connection creation timed out')), 5000)
            )
          ]) as SQLiteDBConnection;
          
          await Promise.race([
            db.open(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Database open timed out')), 5000)
            )
          ]);
          
          this.storage = new SQLiteStorage(db);
          await this.storage.init();
          this.initialized = true;
          console.log('SQLite storage initialized successfully');
        } catch (error) {
          console.error('Error initializing SQLite storage:', error);
          throw error; // Re-throw to be caught by the outer catch
        }
      } catch (error) {
        console.error('Error initializing storage:', error);
        // Fallback to web storage
        this.storage = new WebStorageFallback();
        await this.storage.init();
        this.initialized = true;
        this.isWebFallback = true;
        console.log('Web storage fallback initialized');
      }
    })();
    
    return this.initializationPromise;
  }

  async getCategories(): Promise<Category[]> {
    try {
      await this.init();
      return await this.storage!.getCategories();
    } catch (error) {
      console.error('Error getting categories:', error);
      return [];
    }
  }

  async addCategory(category: Omit<Category, 'id'>): Promise<number> {
    try {
      await this.init();
      return await this.storage!.addCategory(category);
    } catch (error) {
      console.error('Error adding category:', error);
      return 0;
    }
  }

  async getLinksByCategory(categoryId: number): Promise<Link[]> {
    try {
      await this.init();
      return await this.storage!.getLinksByCategory(categoryId);
    } catch (error) {
      console.error('Error getting links by category:', error);
      return [];
    }
  }

  async getAllLinks(): Promise<Link[]> {
    try {
      await this.init();
      return await this.storage!.getAllLinks();
    } catch (error) {
      console.error('Error getting all links:', error);
      return [];
    }
  }

  async addLink(link: Omit<Link, 'id'>): Promise<number> {
    try {
      await this.init();
      return await this.storage!.addLink(link);
    } catch (error) {
      console.error('Error adding link:', error);
      return 0;
    }
  }

  async deleteLink(id: number): Promise<boolean> {
    try {
      await this.init();
      return await this.storage!.deleteLink(id);
    } catch (error) {
      console.error('Error deleting link:', error);
      return false;
    }
  }

  async deleteCategory(id: number): Promise<boolean> {
    try {
      await this.init();
      return await this.storage!.deleteCategory(id);
    } catch (error) {
      console.error('Error deleting category:', error);
      return false;
    }
  }

  async updateCategory(category: Category): Promise<boolean> {
    try {
      await this.init();
      return await this.storage!.updateCategory(category);
    } catch (error) {
      console.error('Error updating category:', error);
      return false;
    }
  }

  async updateLink(link: Link): Promise<boolean> {
    try {
      await this.init();
      return await this.storage!.updateLink(link);
    } catch (error) {
      console.error('Error updating link:', error);
      return false;
    }
  }

  async closeConnection(): Promise<void> {
    if (!this.isWebFallback && this.storage instanceof SQLiteStorage) {
      try {
        await this.storage.closeConnection();
        console.log('Database connection closed successfully');
      } catch (error) {
        console.error('Error closing database connection:', error);
        throw error;
      }
    }
  }
  
  getStorageType(): string {
    return this.isWebFallback ? 'Web Storage' : 'SQLite';
  }
}

export const dbService = new DatabaseService();
