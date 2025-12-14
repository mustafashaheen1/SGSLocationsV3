'use client';

import { usePathname } from 'next/navigation';
import './globals.css';
import { Inter } from 'next/font/google';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Toaster } from '@/components/ui/toaster';
// import { SessionMonitor } from '@/components/SessionMonitor'; // ❌ DISABLED - Causes infinite refresh loop

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin');

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
      </head>
      <body className={inter.className}>
        {/* <SessionMonitor /> */} {/* ❌ DISABLED - Causes infinite refresh loop */}
        {!isAdminPage && <Navbar />}
        {children}
        {!isAdminPage && <Footer />}
        <Toaster />
      </body>
    </html>
  );
}
