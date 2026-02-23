import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("Kontrollin ühendust:", { 
  urlOlemas: !!supabaseUrl, 
  keyOlemas: !!supabaseKey 
});

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL või Key on puudu! Kontrolli oma .env faili.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);