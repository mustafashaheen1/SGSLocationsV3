import './globals.css';
import { Inter } from 'next/font/google';
import { LayoutShell, SharedLayoutData } from '@/components/LayoutShell';
import { Toaster } from '@/components/ui/toaster';
import { directFetch } from '@/lib/direct-fetch';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'SGS Locations',
  description: 'Dallas Fort Worth\'s largest location database connecting property owners with production companies',
};

// Helper to parse JSON values with multiple layers of escaping
function parseValue(value: any): string {
  if (!value) return '';
  if (typeof value === 'string') {
    try {
      let parsed = value;
      while (typeof parsed === 'string' && (parsed.startsWith('"') || parsed.startsWith('\\"'))) {
        parsed = JSON.parse(parsed);
      }
      return parsed;
    } catch (e) {
      return value.replace(/^"|"$/g, '');
    }
  }
  return String(value);
}

async function getSharedLayoutData(): Promise<SharedLayoutData> {
  try {
    const [settingsResult, socialResult, categoriesResult, logoResult] = await Promise.all([
      directFetch('site_settings', {
        in: { key: ['portfolio_visible', 'footer_description', 'contact_phone', 'contact_email', 'contact_address', 'office_hours'] }
      }),
      directFetch('social_links', { eq: { is_active: true }, order: 'display_order', ascending: true }),
      directFetch('categories', { select: 'id, name, slug', eq: { is_active: true }, order: 'display_order', ascending: true, limit: 10 }),
      directFetch('app_settings', { eq: { setting_key: 'site_logo_url' }, maybeSingle: true }),
    ]);

    const settings = settingsResult.data || [];
    const settingsMap: Record<string, string> = {};
    settings.forEach((s: any) => {
      settingsMap[s.key] = s.value;
    });

    // Parse portfolio_visible
    let portfolioVisible = true;
    try {
      const pv = settingsMap['portfolio_visible'];
      if (pv) {
        const parsed = typeof pv === 'string' ? JSON.parse(pv) : pv;
        portfolioVisible = parsed === true || parsed === 'true';
      }
    } catch {
      portfolioVisible = true;
    }

    // Filter social links with valid URLs
    const socialLinks = (socialResult.data || []).filter((link: any) => link.url && link.url.trim() !== '');

    return {
      siteLogo: logoResult.data?.setting_value || '',
      portfolioVisible,
      footerContent: {
        description: parseValue(settingsMap['footer_description']) || '',
        phone: parseValue(settingsMap['contact_phone']) || '',
        email: parseValue(settingsMap['contact_email']) || '',
        address: parseValue(settingsMap['contact_address']) || '',
        officeHours: parseValue(settingsMap['office_hours']) || '',
      },
      socialLinks,
      footerCategories: categoriesResult.data || [],
    };
  } catch (error) {
    console.error('Error fetching shared layout data:', error);
    return {
      siteLogo: '',
      portfolioVisible: true,
      footerContent: { description: '', phone: '', email: '', address: '', officeHours: '' },
      socialLinks: [],
      footerCategories: [],
    };
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sharedData = await getSharedLayoutData();

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
      </head>
      <body className={inter.className}>
        <LayoutShell sharedData={sharedData}>{children}</LayoutShell>
        <Toaster />
      </body>
    </html>
  );
}
