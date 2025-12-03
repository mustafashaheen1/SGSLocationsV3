import { supabase, SavedSearch } from '@/lib/supabase';

/**
 * Save or update a search for the current user
 * If a matching search exists (same text, filters, and tags), update its result count
 * Otherwise, create a new saved search
 */
export async function saveSearch(
  searchText: string,
  filters: Record<string, string[]>,
  tags: string[],
  resultCount: number
): Promise<{ data: SavedSearch | null; error: any }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: { message: 'Not authenticated' } };
    }

    // Normalize data for comparison
    const normalizedTags = [...tags].sort();
    const normalizedFilters = Object.keys(filters).sort().reduce((acc, key) => {
      acc[key] = [...filters[key]].sort();
      return acc;
    }, {} as Record<string, string[]>);

    // Check if this exact search already exists
    const { data: existingSearches, error: fetchError } = await (supabase
      .from('saved_searches') as any)
      .select('*')
      .eq('user_id', user.id)
      .eq('search_text', searchText);

    if (fetchError) throw fetchError;

    // Find a matching search (same text, filters, and tags)
    const matchingSearch = (existingSearches as any[] || []).find((search: any) => {
      const searchTags = [...(search.tags || [])].sort();
      const searchFilters = Object.keys(search.filters || {}).sort().reduce((acc, key) => {
        acc[key] = [...(search.filters[key] || [])].sort();
        return acc;
      }, {} as Record<string, string[]>);

      return (
        JSON.stringify(searchTags) === JSON.stringify(normalizedTags) &&
        JSON.stringify(searchFilters) === JSON.stringify(normalizedFilters)
      );
    });

    if (matchingSearch) {
      // Update existing search
      const { data, error } = await (supabase
        .from('saved_searches') as any)
        .update({
          result_count: resultCount,
          last_checked_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', matchingSearch.id)
        .select()
        .single();

      return { data, error };
    } else {
      // Create new search
      const { data, error } = await (supabase
        .from('saved_searches') as any)
        .insert([{
          user_id: user.id,
          search_text: searchText,
          filters: normalizedFilters,
          tags: normalizedTags,
          result_count: resultCount,
        }])
        .select()
        .single();

      return { data, error };
    }
  } catch (error) {
    console.error('Error saving search:', error);
    return { data: null, error };
  }
}

/**
 * Get all saved searches for the current user
 */
export async function getSavedSearches(): Promise<SavedSearch[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('saved_searches')
      .select('*')
      .eq('user_id', user.id)
      .order('last_checked_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching saved searches:', error);
    return [];
  }
}

/**
 * Delete a saved search
 */
export async function deleteSavedSearch(searchId: string): Promise<{ error: any }> {
  try {
    const { error } = await supabase
      .from('saved_searches')
      .delete()
      .eq('id', searchId);

    return { error };
  } catch (error) {
    console.error('Error deleting saved search:', error);
    return { error };
  }
}

/**
 * Build a search URL from saved search data
 */
export function buildSearchUrl(savedSearch: SavedSearch): string {
  const params = new URLSearchParams();

  // Add search text
  if (savedSearch.search_text) {
    params.set('q', savedSearch.search_text);
  }

  // Add filters
  if (savedSearch.filters && Object.keys(savedSearch.filters).length > 0) {
    Object.entries(savedSearch.filters).forEach(([key, values]) => {
      if (Array.isArray(values) && values.length > 0) {
        params.set(key, values.join(','));
      }
    });
  }

  // Add tags
  if (savedSearch.tags && savedSearch.tags.length > 0) {
    params.set('tags', savedSearch.tags.join(','));
  }

  return `/search?${params.toString()}`;
}
