import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL ?? "https://placeholder.supabase.co";
const supabaseKey = process.env.SUPABASE_ANON_KEY ?? "placeholder";

// Server-only client (never import this in client components)
export const supabase = createClient(supabaseUrl, supabaseKey);
