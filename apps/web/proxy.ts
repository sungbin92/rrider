import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_HINT_COOKIE = 'rrider_auth_hint';

const protectedRoutes = ['/plans'];
const authRoutes = ['/auth/login', '/auth/register'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authHint = request.cookies.get(AUTH_HINT_COOKIE)?.value;
  const isAuthenticated = authHint === '1';

  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  const isAuthRoute = authRoutes.some((route) => pathname === route);

  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/plans', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/plans/:path*', '/auth/:path*'],
};
