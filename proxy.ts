import { jwtVerify, createRemoteJWKSet, type JWTPayload } from 'jose'
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Cache the JWKS set at module level — fetched once per process, not per request.
// createRemoteJWKSet handles key matching by kid header automatically.
const JWKS = createRemoteJWKSet(
  new URL('https://wqfhplpstiybpskszzxe.supabase.co/auth/v1/.well-known/jwks.json')
)

const AUTH_COOKIE_PATTERN = /^sb-[a-z0-9]+-auth-token(?:\.\d+)?$/
const AUTH_COOKIE_SUFFIX_PATTERN = /\.(\d+)$/

function decodeBase64UrlUtf8(input: string): string | null {
  try {
    const normalized = input.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized + '='.repeat((4 - (normalized.length % 4 || 4)) % 4)
    const binary = atob(padded)
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0))
    return new TextDecoder().decode(bytes)
  } catch {
    return null
  }
}

function extractAccessTokenFromCookieValue(raw: string): string | null {
  const candidates = [raw]

  try {
    candidates.push(decodeURIComponent(raw))
  } catch {
    // ignore malformed URI encoding
  }

  for (const candidate of candidates) {
    const decodedCandidates = [candidate]

    if (candidate.startsWith('base64-')) {
      const decoded = decodeBase64UrlUtf8(candidate.slice('base64-'.length))
      if (decoded) decodedCandidates.push(decoded)
    }

    const decoded = decodeBase64UrlUtf8(candidate)
    if (decoded) decodedCandidates.push(decoded)

    for (const decoded of decodedCandidates) {
      try {
        const parsed = JSON.parse(decoded) as Record<string, unknown> | null
        if (parsed && typeof parsed === 'object') {
          const direct = parsed.access_token
          if (typeof direct === 'string' && direct.length > 0) return direct

          const currentSession = parsed.currentSession
          if (currentSession && typeof currentSession === 'object') {
            const nested = (currentSession as Record<string, unknown>).access_token
            if (typeof nested === 'string' && nested.length > 0) return nested
          }
        }
      } catch {
        // ignore invalid JSON, try next decode path
      }
    }
  }

  return null
}

function getFullNameFromPayload(payload: JWTPayload | null): string | null {
  if (!payload || typeof payload !== 'object') return null
  const userMetadata = (payload as Record<string, unknown>).user_metadata
  if (!userMetadata || typeof userMetadata !== 'object') return null
  const fullName = (userMetadata as Record<string, unknown>).full_name
  return typeof fullName === 'string' && fullName.length > 0 ? fullName : null
}

// Verify the Supabase JWT locally using the cached JWKS — ~0ms.
// @supabase/ssr stores the session as base64url-encoded JSON in a cookie named
// sb-<project-ref>-auth-token (may be chunked into .0, .1, ... parts).
async function verifyJwtLocally(request: NextRequest): Promise<JWTPayload | null> {

  const allCookies = request.cookies.getAll()

  // Find the auth cookie base name, e.g. "sb-<project-ref>-auth-token".
  // Supabase may only set chunked cookies (.0, .1, ...) without a base cookie.
  const candidateNames = allCookies
    .map(c => c.name)
    .filter(name => AUTH_COOKIE_PATTERN.test(name))
    .map(name => name.replace(AUTH_COOKIE_SUFFIX_PATTERN, ''))
  const baseNames = [...new Set(candidateNames)]
  if (!baseNames.length) return null

  // Try each candidate auth cookie until one verifies.
  for (const baseName of baseNames) {
    let raw = request.cookies.get(baseName)?.value ?? ''
    for (let i = 0; ; i++) {
      const chunk = request.cookies.get(`${baseName}.${i}`)
      if (!chunk) break
      raw += chunk.value
    }
    if (!raw) continue

    const accessToken = extractAccessTokenFromCookieValue(raw)
    if (!accessToken) continue

    try {
      const { payload } = await jwtVerify(accessToken, JWKS)
      return payload
    } catch {
      // try next cookie candidate
    }
  }

  return null
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const { pathname } = request.nextUrl
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup')
  const isApiRoute = pathname.startsWith('/api')
  const isCallback = pathname.startsWith('/auth/callback')

  // --- Fast path: verify JWT locally ---
  const t0 = Date.now()
  const payload = await verifyJwtLocally(request)
  let userId = payload?.sub ?? null
  let email = (payload?.email as string) ?? ''
  let fullName = getFullNameFromPayload(payload)

  // --- Slow path: fall back to network only if local verification failed ---
  if (!userId) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      },
    )
    const { data: { user } } = await supabase.auth.getUser()
    userId = user?.id ?? null
    email = user?.email ?? ''
    fullName = user?.user_metadata?.full_name ?? null
    console.log(`[proxy] getUser (network fallback): ${Date.now() - t0}ms  path=${pathname}`)
  } else {
    console.log(`[proxy] getUser (local JWT): ${Date.now() - t0}ms  path=${pathname}`)
  }

  if (!userId && !isAuthRoute && !isApiRoute && !isCallback) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (userId && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  if (userId) {
    supabaseResponse.headers.set('x-user-id', userId)
    supabaseResponse.headers.set('x-user-email', email)
    if (fullName) supabaseResponse.headers.set('x-user-name', fullName)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
