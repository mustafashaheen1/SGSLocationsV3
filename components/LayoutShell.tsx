'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { AuthProvider } from '@/components/AuthProvider';

export interface SharedLayoutData {
  siteLogo: string;
  portfolioVisible: boolean;
  footerContent: {
    description: string;
    phone: string;
    email: string;
    address: string;
    officeHours: string;
  };
  socialLinks: any[];
  footerCategories: any[];
}

export function LayoutShell({
  children,
  sharedData,
}: {
  children: React.ReactNode;
  sharedData: SharedLayoutData;
}) {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin');

  return (
    <AuthProvider>
      {!isAdminPage && (
        <Navbar
          siteLogo={sharedData.siteLogo}
          portfolioVisible={sharedData.portfolioVisible}
        />
      )}
      {children}
      {!isAdminPage && (
        <Footer
          siteLogo={sharedData.siteLogo}
          footerContent={sharedData.footerContent}
          socialLinks={sharedData.socialLinks}
          categories={sharedData.footerCategories}
        />
      )}
    </AuthProvider>
  );
}
