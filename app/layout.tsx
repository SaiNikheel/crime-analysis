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
        <meta name="description" content="Analyze News patterns and gain insights from news reports across regions. Explore interactive maps and AI-powered summaries." />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://crime-analysis-o4xf.vercel.app/" />
        <meta property="og:title" content="News Analysis Dashboard" />
        <meta property="og:description" content="Analyze News patterns and gain insights from news reports across regions. Explore interactive maps and AI-powered summaries." />
        <meta property="og:image" content="https://crime-analysis-o4xf.vercel.app/logo.png" />
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://crime-analysis-o4xf.vercel.app/" />
        <meta property="twitter:title" content="News Analysis Dashboard" />
        <meta property="twitter:description" content="Analyze crime patterns and gain insights from news reports across regions. Explore interactive maps and AI-powered summaries." />
        <meta property="twitter:image" content="https://crime-analysis-o4xf.vercel.app/logo.png" />
        <title>News Analysis Dashboard</title>
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