import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { generateSessionId } from './src/lib/session';

const SIX_MONTHS_IN_SECONDS = 60 * 60 * 24 * 30 * 6;

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const sessionCookie = request.cookies.get('sid');
  if (!sessionCookie) {
    const sessionId = generateSessionId();
    response.cookies.set('sid', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SIX_MONTHS_IN_SECONDS,
      path: '/',
    });
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
