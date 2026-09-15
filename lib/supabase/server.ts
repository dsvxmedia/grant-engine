import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './database.types'
import { createDemoClient, isDemoMode } from '@/lib/demo/client'
import { realDbRequested } from '@/lib/demo/context'

export async function createClient() {
  // Demo mode never touches the real database: it reads the fictional dataset in
  // lib/demo/fixtures instead, so a public visitor cannot see real organizations.
  if (isDemoMode() && !realDbRequested()) return createDemoClient()

  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}

export async function createServiceClient() {
  if (isDemoMode() && !realDbRequested()) return createDemoClient()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
}
