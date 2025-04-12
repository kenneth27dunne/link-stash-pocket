import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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