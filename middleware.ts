import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAdmin = token?.role === 'admin';
    const isPolice = token?.role === 'police';
    const isUser = token?.role === 'user';

    // Allow access to all authenticated users
    if (token) {
      return NextResponse.next();
    }

    // Redirect to sign in if not authenticated
    return NextResponse.redirect(new URL('/auth/signin', req.url));
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/incidents/:path*',
    '/api/analytics/:path*',
  ],
}; 