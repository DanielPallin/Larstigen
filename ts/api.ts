// 1. Importera verktyget från Supabase
import { createClient } from '@supabase/supabase-js';

// 2. Hämta nycklarna från .env.local
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 3. Skapa och exportera klienten
export const supabase = createClient(supabaseUrl, supabaseAnonKey);