/**
 * Supabase environment configuration.
 * Switches between dev and prod based on NODE_ENV.
 * Service role key is server-only and never exposed to the frontend.
 */

const isDev = process.env.NODE_ENV === 'development';
const env = isDev ? 'development' : 'production';

let logged = false;
function logOnce() {
  if (typeof window === 'undefined' && !logged) {
    logged = true;
    console.log(`[Supabase] Environment: ${env} (NODE_ENV=${process.env.NODE_ENV})`);
  }
}

/** Supabase project URL (client + server). Use dev or prod based on NODE_ENV. */
export function getSupabaseUrl(): string {
  logOnce();
  const url = isDev
    ? (process.env.NEXT_PUBLIC_SUPABASE_DEV_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL)
    : (process.env.NEXT_PUBLIC_SUPABASE_PROD_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL);
  return url || '';
}

/** Supabase anon key (client + server). Safe to expose in frontend. */
export function getSupabaseAnonKey(): string {
  logOnce();
  const key = isDev
    ? (process.env.NEXT_PUBLIC_SUPABASE_DEV_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    : (process.env.NEXT_PUBLIC_SUPABASE_PROD_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  return key || '';
}

/**
 * Supabase service role key (SERVER ONLY).
 * Never imported or used in client code. Bypasses RLS.
 */
export function getSupabaseServiceRoleKey(): string {
  logOnce();
  const key = isDev
    ? (process.env.SUPABASE_DEV_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY)
    : (process.env.SUPABASE_PROD_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY);
  return key || '';
}
