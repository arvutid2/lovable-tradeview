

# Connect to External Supabase Project

## Overview
Swap the dashboard from the internal Lovable Cloud database to your external Supabase project and fix Realtime.

## Changes

### 1. Update Supabase Client Configuration
Update `src/integrations/supabase/client.ts` to point to your external project:
- URL: `https://lnhxhjiqtwqlmbunrgtl.supabase.co`
- Anon Key: `sb_publishable_CAQEJH6y2w-KbR8d3l-yQg_qZ-08zKj`

Since the auto-generated client reads from `.env`, we will create a separate client file (e.g., `src/lib/supabaseExternal.ts`) that hardcodes your external project credentials, and update all imports to use it. The anon key is a publishable key, so it is safe to include in the codebase.

### 2. Update All Data Imports
- Update `src/hooks/useTradeData.ts` to import from the new external client
- Ensure the Realtime channel subscription uses the external client

### 3. Verify Realtime Subscription
The existing `useTradeData.ts` hook already subscribes to `INSERT` events on `trade_logs` via `supabase.channel()`. After switching the client, this will automatically listen to your external database. No logic changes needed.

### 4. Remove Demo Data Dependency
No code changes needed here -- once pointed at the real database, only real rows will appear. The hook already sorts by `created_at` descending and limits to 100.

## Technical Details
- New file: `src/lib/supabaseExternal.ts` -- dedicated client for external Supabase
- Modified file: `src/hooks/useTradeData.ts` -- update import path
- Modified files: Any other components importing the Supabase client (currently only the hook)

