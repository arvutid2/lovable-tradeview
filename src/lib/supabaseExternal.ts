import { createClient } from '@supabase/supabase-js';

const EXTERNAL_SUPABASE_URL = 'https://lnhxhjiqtwqlmbunrgtl.supabase.co';
const EXTERNAL_SUPABASE_ANON_KEY = 'sb_publishable_CAQEJH6y2w-KbR8d3l-yQg_qZ-08zKj';

export const supabaseExternal = createClient(EXTERNAL_SUPABASE_URL, EXTERNAL_SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
