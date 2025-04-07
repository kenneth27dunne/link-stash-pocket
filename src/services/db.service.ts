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
  categoryId: number;
  type: 'image' | 'video' | 'file' | 'other';
  createdAt?: string;
}

class DatabaseService {
  private sqlite: SQLiteConnection;
  private db!: SQLiteDBConnection;
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
    console.log('DatabaseService instance created');
  }

  async init(): Promise<void> {
    if (this.initialized) {
      console.log('Database already initialized, skipping initialization');
      return;
    }

    if (this.initializationPromise) {
      console.log('Initialization already in progress, returning existing promise');
      return this.initializationPromise;
    }

    this.initializationPromise = this._init();
    
    try {
      await this.initializationPromise;
    } catch (error) {
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
        console.log('Initializing web store for SQLite...');
        try {
          await this.sqlite.initWebStore();
          console.log('Web store initialized successfully');
        } catch (error) {
          console.error('Error initializing web store:', error);
          throw new Error('Failed to initialize web store: ' + (error instanceof Error ? error.message : String(error)));
        }
      }

      console.log('Creating database connection...');
      try {
        this.db = await this.sqlite.createConnection('linkstash_db', false, 'no-encryption', 1, false);
        console.log('Database connection created');
      } catch (error) {
        console.error('Error creating database connection:', error);
        throw new Error('Failed to create connection: ' + (error instanceof Error ? error.message : String(error)));
      }
      
      console.log('Opening database connection...');
      try {
        await this.db.open();
        console.log('Database connection opened');
      } catch (error) {
        console.error('Error opening database connection:', error);
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
      } catch (error) {
        console.error('Error creating tables:', error);
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
      const result = await this.db.run(
        'INSERT INTO links (url, title, description, thumbnail, categoryId, type) VALUES (?, ?, ?, ?, ?, ?)',
        [link.url, link.title || null, link.description || null, link.thumbnail || null, link.categoryId, link.type]
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
      const result = await this.db.run('DELETE FROM categories WHERE id = ?', [id]);
      return result.changes?.changes > 0;
    } catch (error) {
      console.error('Error deleting category:', error);
      return false;
    }
  }

  async closeConnection(): Promise<void> {
    if (this.db) {
      await this.sqlite.closeConnection('linkstash_db', false);
    }
  }
}

export const dbService = new DatabaseService();
