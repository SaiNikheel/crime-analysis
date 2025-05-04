'use client';

import { Inter } from 'next/font/google';
import { SessionProvider } from 'next-auth/react';
import Navigation from '@/components/Navigation';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-gray-100">
      <head>
        <link rel="icon" href="/logo.png" />
      </head>
      <body className={`${inter.className} h-full`}>
        <SessionProvider>
          <div className="min-h-full">
            <Navigation />
            <main>{children}</main>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
} 