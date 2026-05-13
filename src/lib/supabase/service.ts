import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

// Sync service client — folosit EXCLUSIV server-side (Server Actions, API Routes, lib/sms.ts)
// NU importa niciodată în componente client
export function createServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
