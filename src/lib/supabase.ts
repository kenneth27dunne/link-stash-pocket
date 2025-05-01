import { createClient, SupabaseClientOptions } from '@supabase/supabase-js';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Custom storage adapter using Capacitor Preferences
const customStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    const { value } = await Preferences.get({ key });
    return value;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    await Preferences.set({ key, value });
  },
  removeItem: async (key: string): Promise<void> => {
    await Preferences.remove({ key });
  },
};

const options: SupabaseClientOptions<'public'> = {};

// Use custom storage only on native platforms
if (Capacitor.isNativePlatform()) {
  options.auth = {
    storage: customStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Important for Capacitor
  };
} else {
  // Optionally configure web storage if needed, defaults work well
  options.auth = {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, options);

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: number
          user_id: string
          name: string
          icon: string
          color: string | null
          description: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          name: string
          icon: string
          color?: string | null
          description?: string | null
          created_at?: string
        }
        Update: {
          user_id?: string
          name?: string
          icon?: string
          color?: string | null
          description?: string | null
          created_at?: string
        }
      }
      links: {
        Row: {
          id: number
          user_id: string
          category_id: number
          url: string
          title: string | null
          description: string | null
          thumbnail: string | null
          favicon: string | null
          type: string
          created_at: string
        }
        Insert: {
          user_id: string
          category_id: number
          url: string
          title?: string | null
          description?: string | null
          thumbnail?: string | null
          favicon?: string | null
          type: string
          created_at?: string
        }
        Update: {
          user_id?: string
          category_id?: number
          url?: string
          title?: string | null
          description?: string | null
          thumbnail?: string | null
          favicon?: string | null
          type?: string
          created_at?: string
        }
      }
    }
  }
} 