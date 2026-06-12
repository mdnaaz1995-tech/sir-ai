import { createBrowserClient } from '@supabase/ssr'

// Fallback strings added to prevent Next.js build crashes if env variables are temporarily missing during static export
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://axbgdvictqcumlhlypie.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_F2G3t3Y5OgcFsEoV8wH'

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)