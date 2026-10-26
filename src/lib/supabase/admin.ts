// Supabase client with the secret key: bypasses Row Level Security. Server only, and only for data that
// isn't a user's own: the shared exchange rates (and, later, cron jobs and payment webhooks).
import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { supabaseUrl } from "./server";

export function adminClient() {
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !secret) return null;
  return createClient<Database>(supabaseUrl, secret, { auth: { persistSession: false, autoRefreshToken: false } });
}
