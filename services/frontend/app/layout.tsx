import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import React from 'react';

import { AppRouterCacheProvider } from '@mui/material-nextjs/v13-appRouter';

import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Rosen MinFee',
  description: 'Rosen Bridge Minimum Fee App',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppRouterCacheProvider>{children}</AppRouterCacheProvider>
      </body>
    </html>
  );
}
