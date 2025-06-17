import { createClient } from '@supabase/supabase-js'

// Get the public Supabase URL and Anon Key from our environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create a single, exportable Supabase client instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Keep the function for backward compatibility
export function getSupabaseClient() {
  return supabase
}