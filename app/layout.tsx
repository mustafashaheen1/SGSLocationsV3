'use client';

import { usePathname } from 'next/navigation';
import './globals.css';
import { Inter } from 'next/font/google';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Toaster } from '@/components/ui/toaster';

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
      <body className={inter.className}>
        {!isAdminPage && <Navbar />}
        {children}
        {!isAdminPage && <Footer />}
        <Toaster />
      </body>
    </html>
  );
}
