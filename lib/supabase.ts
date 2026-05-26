import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy-supabase-url-for-build.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "dummy-service-role-key-for-build";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy-anon-key-for-build";

// Use service role — ONLY server-side. Never expose to client.
export const supabaseAdmin = createClient(
  supabaseUrl,
  serviceRoleKey,
  { auth: { persistSession: false } }
);

// Public client for client-side use (anon key)
export const supabase = createClient(
  supabaseUrl,
  anonKey
);
