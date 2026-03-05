import { directFetch } from '@/lib/direct-fetch';
import { HeroSection } from '@/components/home/HeroSection';
import { FeaturedProperties } from '@/components/home/FeaturedProperties';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { ProductionLogos } from '@/components/home/ProductionLogos';
import { ServicesSection } from '@/components/home/ServicesSection';
import { CTASection } from '@/components/home/CTASection';

export default async function HomePage() {
  // All 5 queries run in parallel on the server
  const [settingsResult, servicesResult, logosResult, featuredResult, categoriesResult] =
    await Promise.all([
      directFetch('site_settings', {
        in: { key: ['hero_video', 'hero_video_poster', 'hero_title', 'hero_subtitle'] }
      }),
      directFetch('services', {
        eq: { is_active: true },
        order: 'display_order',
        ascending: true
      }),
      directFetch('production_logos', {
        eq: { is_active: true },
        order: 'display_order',
        ascending: true
      }),
      directFetch('properties', {
        eq: { status: 'active', is_featured: true },
        order: 'name',
        ascending: true,
        limit: 6
      }),
      directFetch('categories', {
        eq: { is_active: true },
        order: 'display_order',
        ascending: true
      }),
    ]);

  // Process settings into a simple map
  const urlKeys = new Set(['hero_video', 'hero_video_poster']);
  const settingsMap: Record<string, string> = {};
  (settingsResult.data || []).forEach((s: any) => {
    let val = (s.value || '').trim().replace(/^["']|["']$/g, '');
    // Only add https:// prefix for URL settings, not text like title/subtitle
    if (urlKeys.has(s.key) && val && !val.startsWith('http') && !val.startsWith('/')) {
      val = `https://${val}`;
    }
    settingsMap[s.key] = val;
  });

  // Filter for subcategories only
  const subcategories = (categoriesResult.data || []).filter((cat: any) => cat.parent_id);

  return (
    <main className="min-h-screen animate-fadeIn">
      <HeroSection
        videoUrl={settingsMap['hero_video'] || ''}
        posterUrl={settingsMap['hero_video_poster'] || ''}
        title={settingsMap['hero_title'] || ''}
        subtitle={settingsMap['hero_subtitle'] || ''}
      />
      <FeaturedProperties properties={featuredResult.data || []} />
      <CategoryGrid categories={subcategories} />
      <ProductionLogos logos={logosResult.data || []} />
      <ServicesSection services={servicesResult.data || []} />
      <CTASection />
    </main>
  );
}
