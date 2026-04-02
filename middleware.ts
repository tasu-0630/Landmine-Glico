import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const basicAuth = req.headers.get('authorization')
  const url = req.nextUrl

  const username = 'tasu0630'
  const password = 'Plus1862ke'

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1]
    const [user, pwd] = atob(authValue).split(':')

    if (user === username && pwd === password) {
      return NextResponse.next()
    }
  }

  url.pathname = '/api/auth'
  return NextResponse.rewrite(url)
}

export const config = {
  matcher: '/:path*',
}
