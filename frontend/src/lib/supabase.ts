import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:3000';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'mock-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

export type Database = {
  public: {
    Tables: {
      pix_keys: {
        Row: {
          id: string;
          type: 'cpf' | 'email' | 'phone' | 'random';
          key: string;
          name: string;
          bank: string;
          account: string;
          agency: string;
          balance: number;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: 'cpf' | 'email' | 'phone' | 'random';
          key: string;
          name: string;
          bank: string;
          account: string;
          agency: string;
          balance?: number;
          active?: boolean;
        };
        Update: {
          id?: string;
          type?: 'cpf' | 'email' | 'phone' | 'random';
          key?: string;
          name?: string;
          bank?: string;
          account?: string;
          agency?: string;
          balance?: number;
          active?: boolean;
        };
      };
      transactions: {
        Row: {
          id: string;
          sender_key: string;
          sender_name: string;
          receiver_key: string;
          receiver_name: string;
          amount: number;
          description: string;
          status: 'pending' | 'completed' | 'failed' | 'cancelled';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sender_key: string;
          sender_name: string;
          receiver_key: string;
          receiver_name: string;
          amount: number;
          description?: string;
          status?: 'pending' | 'completed' | 'failed' | 'cancelled';
        };
        Update: {
          id?: string;
          sender_key?: string;
          sender_name?: string;
          receiver_key?: string;
          receiver_name?: string;
          amount?: number;
          description?: string;
          status?: 'pending' | 'completed' | 'failed' | 'cancelled';
        };
      };
    };
  };
};
