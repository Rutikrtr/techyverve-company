import { NextResponse } from 'next/server';

// Page-level gate: no cookie -> /login. Real verification happens in the API (withAuth).
export function middleware(req) {
  const { pathname } = req.nextUrl;
  const hasCookie = Boolean(req.cookies.get('tv_session')?.value);

  if (pathname === '/login') {
    if (hasCookie) return NextResponse.redirect(new URL('/dashboard', req.url));
    return NextResponse.next();
  }
  if (!hasCookie) return NextResponse.redirect(new URL('/login', req.url));
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|icon.svg).*)'],
};
