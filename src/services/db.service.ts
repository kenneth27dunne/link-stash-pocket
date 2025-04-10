import { Capacitor } from '@capacitor/core';
import { SQLiteConnection, SQLiteDBConnection, CapacitorSQLite } from '@capacitor-community/sqlite';

export interface Category {
  id?: number;
  name: string;
  icon: string;
  color?: string;
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

// Web fallback storage using localStorage
class WebStorageFallback {
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

  async addCategory(category: Category): Promise<number> {
    const categories = await this.getCategories();
    const newId = categories.length > 0 ? Math.max(...categories.map(c => c.id || 0)) + 1 : 1;
    const newCategory = { ...category, id: newId, createdAt: new Date().toISOString() };
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

  async addLink(link: Link): Promise<number> {
    const links = await this.getAllLinks();
    const newId = links.length > 0 ? Math.max(...links.map(l => l.id || 0)) + 1 : 1;
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

  async initialize(): Promise<void> {
    // Initialize with default categories if none exist
    const categories = await this.getCategories();
    if (categories.length === 0) {
      await this.addCategory({ name: 'Videos', icon: 'video' });
      await this.addCategory({ name: 'Images', icon: 'image' });
    }
  }
}

class DatabaseService {
  private sqlite: SQLiteConnection;
  private db!: SQLiteDBConnection;
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;
  private webFallback: WebStorageFallback;
  private isWebFallback = false;

  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
    this.webFallback = new WebStorageFallback();
    console.log('DatabaseService instance created');
  }

  async init(): Promise<void> {
    console.log('init() called, initialized:', this.initialized);
    if (this.initialized) {
      console.log('Database already initialized, skipping initialization');
      return;
    }

    if (this.initializationPromise) {
      console.log('Initialization already in progress, returning existing promise');
      return this.initializationPromise;
    }

    console.log('Starting new initialization process');
    this.initializationPromise = this._init();
    
    try {
      await this.initializationPromise;
      console.log('Initialization promise resolved successfully');
    } catch (error) {
      console.error('Initialization promise failed:', error);
      this.initializationPromise = null;
      throw error;
    }
  }

  private async _init(): Promise<void> {
    try {
      console.log('Starting database initialization...');
      const platform = Capacitor.getPlatform();
      console.log('Current platform:', platform);
      
      if (platform === 'web') {
        console.log('Web platform detected, attempting SQLite initialization...');
        try {
          // Try to initialize SQLite for web with a timeout
          console.log('Calling initWebStore()...');
          
          // Create a promise that rejects after 5 seconds
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('SQLite web initialization timed out')), 5000);
          });
          
          // Race the initialization against the timeout
          await Promise.race([
            this.sqlite.initWebStore(),
            timeoutPromise
          ]);
          
          console.log('Web store initialized successfully');
        } catch (error) {
          console.warn('Failed to initialize SQLite for web, falling back to localStorage:', error);
          this.isWebFallback = true;
          await this.webFallback.initialize();
          this.initialized = true;
          console.log('Web fallback storage initialized successfully');
          return;
        }
      }

      // If we're here, either we're on a native platform or SQLite web initialization succeeded
      console.log('Creating database connection...');
      try {
        this.db = await this.sqlite.createConnection('linkstash_db', false, 'no-encryption', 1, false);
        console.log('Database connection created successfully');
      } catch (error) {
        console.error('Error creating database connection:', error);
        if (platform === 'web') {
          console.warn('Falling back to localStorage after connection error');
          this.isWebFallback = true;
          await this.webFallback.initialize();
          this.initialized = true;
          return;
        }
        throw new Error('Failed to create connection: ' + (error instanceof Error ? error.message : String(error)));
      }
      
      console.log('Opening database connection...');
      try {
        await this.db.open();
        console.log('Database connection opened');
      } catch (error) {
        console.error('Error opening database connection:', error);
        if (platform === 'web') {
          console.warn('Falling back to localStorage after open error');
          this.isWebFallback = true;
          await this.webFallback.initialize();
          this.initialized = true;
          return;
        }
        throw new Error('Failed to open connection: ' + (error instanceof Error ? error.message : String(error)));
      }

      console.log('Creating tables if not exist...');
      const queryCategories = `
        CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          icon TEXT NOT NULL,
          color TEXT,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `;

      const queryLinks = `
        CREATE TABLE IF NOT EXISTS links (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          url TEXT NOT NULL,
          title TEXT,
          description TEXT,
          thumbnail TEXT,
          favicon TEXT,
          categoryId INTEGER NOT NULL,
          type TEXT NOT NULL,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (categoryId) REFERENCES categories (id) ON DELETE CASCADE
        );
      `;

      try {
        await this.db.execute(queryCategories);
        console.log('Categories table created/verified');
        
        await this.db.execute(queryLinks);
        console.log('Links table created/verified');

        // Check if favicon column exists, if not add it
        try {
          await this.db.query('SELECT favicon FROM links LIMIT 1');
          console.log('Favicon column exists');
        } catch (error) {
          console.log('Favicon column does not exist, adding it...');
          await this.db.execute('ALTER TABLE links ADD COLUMN favicon TEXT');
          console.log('Favicon column added successfully');
        }
      } catch (error) {
        console.error('Error creating tables:', error);
        if (platform === 'web') {
          console.warn('Falling back to localStorage after table creation error');
          this.isWebFallback = true;
          await this.webFallback.initialize();
          this.initialized = true;
          return;
        }
        throw new Error('Failed to create tables: ' + (error instanceof Error ? error.message : String(error)));
      }

      console.log('Checking for default categories...');
      try {
        const result = await this.db.query("SELECT COUNT(*) as count FROM categories");
        
        if (result.values && result.values[0].count === 0) {
          console.log('No categories found, adding default categories...');
          await this.db.run(`
            INSERT INTO categories (name, icon) VALUES 
            ('Videos', 'video'),
            ('Images', 'image')
          `, []);
          console.log('Default categories added');
        } else {
          console.log('Default categories already exist');
        }
      } catch (error) {
        console.error('Error checking default categories:', error);
        if (platform === 'web') {
          console.warn('Falling back to localStorage after default categories error');
          this.isWebFallback = true;
          await this.webFallback.initialize();
          this.initialized = true;
          return;
        }
        throw new Error('Failed to check/add default categories: ' + (error instanceof Error ? error.message : String(error)));
      }

      this.initialized = true;
      console.log('Database initialization completed successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
      this.initialized = false;
      this.initializationPromise = null;
      throw error;
    }
  }

  async getCategories(): Promise<Category[]> {
    try {
      await this.init();
      if (this.isWebFallback) {
        return this.webFallback.getCategories();
      }
      const result = await this.db.query('SELECT * FROM categories ORDER BY id ASC');
      return result.values || [];
    } catch (error) {
      console.error('Error getting categories:', error);
      return [];
    }
  }

  async addCategory(category: Category): Promise<number> {
    try {
      await this.init();
      if (this.isWebFallback) {
        return this.webFallback.addCategory(category);
      }
      const result = await this.db.run(
        'INSERT INTO categories (name, icon, color) VALUES (?, ?, ?)',
        [category.name, category.icon, category.color || null]
      );
      return result.changes?.lastId || 0;
    } catch (error) {
      console.error('Error adding category:', error);
      return 0;
    }
  }

  async getLinksByCategory(categoryId: number): Promise<Link[]> {
    try {
      await this.init();
      if (this.isWebFallback) {
        return this.webFallback.getLinksByCategory(categoryId);
      }
      const result = await this.db.query(
        'SELECT * FROM links WHERE categoryId = ? ORDER BY id DESC',
        [categoryId]
      );
      return result.values || [];
    } catch (error) {
      console.error('Error getting links by category:', error);
      return [];
    }
  }

  async getAllLinks(): Promise<Link[]> {
    try {
      await this.init();
      if (this.isWebFallback) {
        return this.webFallback.getAllLinks();
      }
      const result = await this.db.query('SELECT * FROM links ORDER BY id DESC');
      return result.values || [];
    } catch (error) {
      console.error('Error getting all links:', error);
      return [];
    }
  }

  async addLink(link: Link): Promise<number> {
    try {
      await this.init();
      if (this.isWebFallback) {
        return this.webFallback.addLink(link);
      }
      const result = await this.db.run(
        'INSERT INTO links (url, title, description, thumbnail, favicon, categoryId, type) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [link.url, link.title || null, link.description || null, link.thumbnail || null, link.favicon || null, link.categoryId, link.type]
      );
      return result.changes?.lastId || 0;
    } catch (error) {
      console.error('Error adding link:', error);
      return 0;
    }
  }

  async deleteLink(id: number): Promise<boolean> {
    try {
      await this.init();
      if (this.isWebFallback) {
        return this.webFallback.deleteLink(id);
      }
      const result = await this.db.run('DELETE FROM links WHERE id = ?', [id]);
      return result.changes?.changes > 0;
    } catch (error) {
      console.error('Error deleting link:', error);
      return false;
    }
  }

  async deleteCategory(id: number): Promise<boolean> {
    try {
      await this.init();
      if (this.isWebFallback) {
        return this.webFallback.deleteCategory(id);
      }
      const result = await this.db.run('DELETE FROM categories WHERE id = ?', [id]);
      return result.changes?.changes > 0;
    } catch (error) {
      console.error('Error deleting category:', error);
      return false;
    }
  }

  async closeConnection(): Promise<void> {
    if (this.db && !this.isWebFallback) {
      await this.sqlite.closeConnection('linkstash_db', false);
    }
  }

  // Method to check which storage method is being used
  getStorageType(): string {
    if (this.isWebFallback) {
      return 'localStorage';
    } else {
      return 'SQLite';
    }
  }
}

export const dbService = new DatabaseService();
