// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export function middleware(request: NextRequest) {
  const sessionId = request.cookies.get('sessionId');

  // If sessionId exists, continue the request
  if (sessionId) {
    return NextResponse.next();
  }

  // If sessionId doesn't exist, generate one
  const newSessionId = uuidv4();

  // Clone the response to set the cookie
  const response = NextResponse.next();

  // Set the sessionId cookie with desired options
  response.cookies.set('sessionId', newSessionId, {
    path: '/',
    httpOnly: true, // Prevents client-side JS from accessing the cookie
    sameSite: 'lax', // CSRF protection
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  });

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|favicon.ico).*)'], // Apply to all routes except API routes, static files, and favicon
};
