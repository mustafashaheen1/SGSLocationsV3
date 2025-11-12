import { createServerClient } from '@/lib/supabase-server';
import SearchPageClient from './search-client';

interface FilterCategory {
  name: string;
  hasSearch: boolean;
  options: string[];
}

export default async function SearchPage() {
  const supabase = createServerClient();

  const [filtersData, propertiesData] = await Promise.all([
    supabase
      .from('search_filters')
      .select(`
        id,
        name,
        slug,
        has_search,
        search_filter_tags (
          name,
          slug
        )
      `)
      .eq('is_active', true)
      .order('display_order'),
    supabase
      .from('properties')
      .select('*')
      .eq('status', 'active')
      .range(0, 23)
  ]);

  const filterCategories: Record<string, FilterCategory> = {};

  if (filtersData.data) {
    for (const filter of filtersData.data) {
      filterCategories[filter.slug] = {
        name: filter.name,
        hasSearch: filter.has_search,
        options: (filter.search_filter_tags || [])
          .map((tag: any) => tag.name)
          .filter(Boolean)
      };
    }
  }

  return (
    <SearchPageClient
      initialFilters={filterCategories}
      initialProperties={propertiesData.data || []}
    />
  );
}
