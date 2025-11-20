# Saved Searches Implementation Guide

This guide shows you how to implement the saved searches feature across your application.

## Overview

Users' searches are automatically saved and displayed in the Dashboard → "My Searches" tab. Each search tracks:
- Search text
- Selected filters
- Selected tags
- Result count (updates on each view)

## Files Created

✅ `/supabase/migrations/20251120000004_create_saved_searches_table.sql` - Database table
✅ `/lib/saved-searches.ts` - Helper functions
✅ `/lib/supabase.ts` - Updated with `SavedSearch` interface

## Changes Needed

### 1. Update Search Page (`app/search/page.tsx`)

Add these imports at the top:

```typescript
import { saveSearch } from '@/lib/saved-searches';
```

Add this state variable (around line 260):

```typescript
const [totalResultCount, setTotalResultCount] = useState(0);
```

Update the `loadMoreProperties` function to track total results and save searches.
Find the function (around line 365) and add this after properties are loaded successfully:

```typescript
// Inside loadMoreProperties function, after setting properties
// Add this in each branch where data is loaded

// For example, after line 406 where you do: setProperties(prev => [...prev, ...data]);
if (page === 1) {
  // First page load - get total count and save search
  const totalCount = data.length; // You may need to query for total count separately
  setTotalResultCount(totalCount);

  // Save the search
  const searchQuery = searchParams.get('q') || '';
  const filtersObj: Record<string, string[]> = {};
  activeFilters.forEach(filter => {
    filtersObj[filter.category] = filter.values;
  });

  const tagsList = searchParams.get('tags')?.split(',').filter(Boolean) || [];

  saveSearch(searchQuery, filtersObj, tagsList, totalCount);
}
```

**Better approach:** Add a new `useEffect` to handle saving after search results change:

Add this `useEffect` after line 592:

```typescript
// Save search when results are loaded
useEffect(() => {
  if (properties.length > 0 && page === 1) {
    const searchQuery = searchParams.get('q') || '';
    const filtersObj: Record<string, string[]> = {};

    activeFilters.forEach(filter => {
      filtersObj[filter.category] = filter.values;
    });

    const tagsList = searchParams.get('tags')?.split(',').filter(Boolean) || [];

    // Save search asynchronously
    saveSearch(searchQuery, filtersObj, tagsList, properties.length).catch(err => {
      console.error('Failed to save search:', err);
    });
  }
}, [properties.length, page, searchParams, activeFilters]);
```

### 2. Update Dashboard (`app/dashboard/page.tsx`)

#### Add imports:

```typescript
import { getSavedSearches, deleteSavedSearch, buildSearchUrl } from '@/lib/saved-searches';
import { SavedSearch } from '@/lib/supabase';
import { Search as SearchIcon, X, TrendingUp } from 'lucide-react';
```

#### Add state:

```typescript
const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
const [loadingSearches, setLoadingSearches] = useState(false);
```

#### Add fetch function:

```typescript
async function fetchSavedSearches() {
  setLoadingSearches(true);
  try {
    const searches = await getSavedSearches();
    setSavedSearches(searches);
  } catch (error) {
    console.error('Error fetching saved searches:', error);
  } finally {
    setLoadingSearches(false);
  }
}
```

#### Call in useEffect:

```typescript
useEffect(() => {
  fetchUserData();
  fetchUserProperties();
  fetchSavedSearches(); // Add this line
}, []);
```

#### Add delete handler:

```typescript
async function handleDeleteSearch(searchId: string) {
  if (!confirm('Are you sure you want to delete this saved search?')) {
    return;
  }

  const { error } = await deleteSavedSearch(searchId);
  if (error) {
    setMessage({ type: 'error', text: 'Failed to delete search' });
  } else {
    setMessage({ type: 'success', text: 'Search deleted successfully!' });
    fetchSavedSearches();
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  }
}
```

#### Replace the "My Searches" tab content (around line 523):

```typescript
{activeTab === 'searches' && (
  <div>
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-gray-900">My Searches</h2>
      <p className="text-gray-600 mt-1">Your recent property searches</p>
    </div>

    {loadingSearches ? (
      <div className="text-center py-12 text-gray-500">
        Loading your searches...
      </div>
    ) : savedSearches.length === 0 ? (
      <div className="text-center py-12">
        <SearchIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 mb-4">No saved searches yet.</p>
        <Button
          onClick={() => router.push('/search')}
          className="bg-[#e11921] text-white hover:bg-[#bf151c]"
        >
          Start Searching
        </Button>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {savedSearches.map((search) => (
          <div
            key={search.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer relative group"
            onClick={() => router.push(buildSearchUrl(search))}
          >
            {/* Delete button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteSearch(search.id);
              }}
              className="absolute top-2 right-2 p-1 bg-red-50 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100"
              title="Delete search"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Search text */}
            {search.search_text && (
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <SearchIcon className="w-4 h-4 text-gray-500" />
                  <span className="text-xs font-medium text-gray-500 uppercase">Search</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">"{search.search_text}"</p>
              </div>
            )}

            {/* Filters */}
            {search.filters && Object.keys(search.filters).length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-500 uppercase mb-2">Filters</p>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(search.filters).map(([key, values]) => (
                    <div key={key}>
                      {(values as string[]).map((value) => (
                        <span
                          key={value}
                          className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full mr-1 mb-1"
                        >
                          {value}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {search.tags && search.tags.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-500 uppercase mb-2">Tags</p>
                <div className="flex flex-wrap gap-1">
                  {search.tags.slice(0, 5).map((tag) => (
                    <span
                      key={tag}
                      className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                    >
                      {tag}
                    </span>
                  ))}
                  {search.tags.length > 5 && (
                    <span className="inline-block px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded">
                      +{search.tags.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Result count */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex items-center gap-1 text-gray-600">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">{search.result_count} properties</span>
              </div>
              <span className="text-xs text-gray-400">
                {new Date(search.last_checked_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
)}
```

## How It Works

1. **User performs search** → Search page loads results
2. **After results load** → Search is automatically saved/updated in database
3. **User visits Dashboard** → Sees all saved searches as cards
4. **User clicks search card** → Redirected to search page with filters pre-applied
5. **Fresh search runs** → Results are current, count updates if changed
6. **User modifies filters** → Considered new search, creates new saved search entry

## Testing

1. Run the SQL migration in Supabase
2. Make the code changes above
3. Test flow:
   - Go to `/search`
   - Enter search text and select some filters/tags
   - Wait for results to load
   - Go to `/dashboard` → "My Searches" tab
   - You should see your search as a card
   - Click the card → should navigate back to search with filters applied
   - Modify a filter → should create a new saved search

## Notes

- Searches are saved per user (requires login)
- Duplicate searches (same text + filters + tags) update the existing record
- Result count updates each time user views the search
- Deleting a search removes it from the database permanently
