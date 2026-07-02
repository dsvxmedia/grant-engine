import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/cron(.*)',
  '/api/webhooks(.*)',
  '/api/admin(.*)',
])

export default clerkMiddleware(async (auth, request) => {
  // Demo mode: block all write operations so the public instance stays read-only
  if (process.env.DEMO_MODE === 'true') {
    const { method } = request
    if (
      (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE') &&
      request.nextUrl.pathname.startsWith('/api/')
    ) {
      return NextResponse.json(
        { error: 'This is a read-only demo instance.' },
        { status: 423 }
      )
    }
  }

  // Dev bypass: NEXT_PUBLIC_DEV_BYPASS=true skips auth for local QA testing
  if (process.env.NEXT_PUBLIC_DEV_BYPASS === 'true' && process.env.NODE_ENV !== 'production') {
    return NextResponse.next()
  }

  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
