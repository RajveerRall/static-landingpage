import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

export function middleware(request: NextRequest) {
  const sessionId = request.cookies.get('sessionId');

  // If no sessionId exists, generate a new one and set it
  if (!sessionId) {
    const response = NextResponse.next();
    response.cookies.set('sessionId', randomUUID(), {
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 day
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'], // Apply middleware only to API routes
};


// // middleware.ts
// import { NextRequest, NextResponse } from 'next/server';
// import { v4 as uuidv4 } from 'uuid';

// export function middleware(request: NextRequest) {
//   const sessionId = request.cookies.get('sessionId');

//   // If sessionId exists, continue the request
//   if (sessionId) {
//     console.log('Existing sessionId:', sessionId.value); // For debugging
//     return NextResponse.next();
//   }

//   // If sessionId doesn't exist, generate one
//   const newSessionId = uuidv4();
//   console.log('Generated new sessionId:', newSessionId); // For debugging

//   // Clone the response to set the cookie
//   const response = NextResponse.next();

//   // Set the sessionId cookie with desired options
//   response.cookies.set('sessionId', newSessionId, {
//     path: '/',
//     httpOnly: true, // Prevents client-side JS from accessing the cookie
//     sameSite: 'lax', // CSRF protection
//     maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
//     secure: process.env.NODE_ENV === 'production', // Ensures cookie is sent over HTTPS
//   });

//   return response;
// }

// export const config = {
//   matcher: ['/((?!api|_next/static|favicon.ico).*)'], // Apply to all routes except API routes, static files, and favicon
// };
