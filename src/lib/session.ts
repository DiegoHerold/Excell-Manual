import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
}

export async function getOrCreateSessionId(): Promise<string> {
  const cookieStore = await cookies();
  let sessionId = cookieStore.get('sid')?.value;
  
  if (!sessionId) {
    sessionId = generateSessionId();
  }
  
  return sessionId;
}

export function setSessionCookie(response: NextResponse, sessionId: string): NextResponse {
  const sixMonths = 6 * 30 * 24 * 60 * 60 * 1000; // 6 months in milliseconds
  
  response.cookies.set('sid', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: sixMonths,
    path: '/',
  });
  
  return response;
}

export function getSessionIdFromRequest(request: NextRequest): string {
  let sessionId = request.cookies.get('sid')?.value;
  
  if (!sessionId) {
    sessionId = generateSessionId();
  }
  
  return sessionId;
}