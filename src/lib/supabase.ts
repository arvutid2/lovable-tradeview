import { supabase as internalSupabase } from "@/integrations/supabase/client";

// Simple re-export used by legacy imports (e.g. "@/lib/supabase").
// Keeps a single source of truth for the Supabase client in the codebase.
export const supabase = internalSupabase;

export default supabase;
