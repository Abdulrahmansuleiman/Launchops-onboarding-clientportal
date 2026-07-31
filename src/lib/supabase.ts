import { createClient } from '@supabase/supabase-js'

const url = (import.meta.env.VITE_SUPABASE_URL as string).trim()
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string).trim()

if (!url || !anonKey) {
  throw new Error('Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
}

export const supabase = createClient(url, anonKey)
