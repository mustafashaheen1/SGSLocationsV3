'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, ChevronDown, X, Bookmark } from 'lucide-react';
import { supabase, Property } from '@/lib/supabase';
import { sortLocationsByExclusivity } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Scrollbar, FreeMode } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/scrollbar';
import 'swiper/css/free-mode';
import LoginModal from '@/components/LoginModal';


interface FilterCategory {
  name: string;
  hasSearch: boolean;
  options: string[];
}

function PropertyCard({ property }: { property: Property & { matchingImages?: string[] } }) {
  const router = useRouter();
  const [showLightbox, setShowLightbox] = useState(false);
  const swiperRef = useRef<any>(null);

  // Get base images
  let baseImages = property.images && property.images.length > 0
    ? property.images
    : property.primary_image
      ? [property.primary_image]
      : ['https://via.placeholder.com/800x600/e5e7eb/6b7280?text=No+Image'];

  // If there are matching images from tag filters, show the first one
  let images = baseImages;
  if (property.matchingImages && property.matchingImages.length > 0) {
    // Always use the first matching image (consistent across re-renders)
    const selectedMatchingImage = property.matchingImages[0];

    // Remove the selected image from base images if it exists, then add it to the front
    const filteredImages = baseImages.filter(img => img !== selectedMatchingImage);
    images = [selectedMatchingImage, ...filteredImages];
  }

  return (
    <>
      <article className="il-search-result">
        <div className="il-react-carousel">
          <div className="swiper-container-wrapper" style={{ position: 'relative' }}>
            <Swiper
              modules={[Navigation, Scrollbar, FreeMode]}
              spaceBetween={3}
              slidesPerView={1}
              freeMode={false}
              loop={false}
              navigation={{
                prevEl: `.nav-prev-${property.id}`,
                nextEl: `.nav-next-${property.id}`,
              }}
              scrollbar={{
                el: `.scrollbar-${property.id}`,
                draggable: true,
                dragClass: 'swiper-scrollbar-drag',
              }}
              onSwiper={(swiper) => {
                swiperRef.current = swiper;
              }}
              style={{
                width: '100%',
                height: '300px',
              }}
            >
              {images.map((img, idx) => (
                <SwiperSlide key={idx}>
                  <Link href={`/property/${property.id}`} style={{ position: 'relative', display: 'block', width: '100%', height: '100%' }}>
                    <Image
                      src={img}
                      alt={`${property.name} - ${idx + 1}`}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      style={{
                        objectFit: 'cover'
                      }}
                      loading={idx === 0 ? "eager" : "lazy"}
                      priority={idx === 0}
                      quality={75}
                      unoptimized={img.includes('placeholder.com')}
                    />
                  </Link>
                </SwiperSlide>
              ))}
            </Swiper>

            <div className={`swiper-button-prev nav-prev-${property.id}`}></div>
            <div className={`swiper-button-next nav-next-${property.id}`}></div>

            <div className={`swiper-scrollbar scrollbar-${property.id}`}></div>
          </div>

          <div style={{ padding: '12px 0', position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ flex: 1 }}>
              <h5 style={{
                fontSize: '18px',
                fontWeight: 400,
                marginBottom: '4px',
                fontFamily: 'acumin-pro-wide, sans-serif',
                margin: 0
              }}>
                <Link
                  href={`/property/${property.id}`}
                  style={{ color: '#212529', textDecoration: 'none' }}
                >
                  {property.name}
                </Link>
              </h5>
              <p style={{
                fontSize: '14px',
                color: '#6c757d',
                marginBottom: 0,
                fontFamily: 'acumin-pro-wide, sans-serif',
                margin: 0
              }}>
                {property.city}
              </p>
            </div>

            <button
              onClick={() => setShowLightbox(true)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                marginLeft: '12px',
                flexShrink: 0
              }}
            >
              <svg
                width="25"
                height="25"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 512 512"
                style={{ color: 'rgb(225, 25, 33)', display: 'block' }}
              >
                <path
                  fill="currentColor"
                  d="M319.8 204v8c0 6.6-5.4 12-12 12h-84v84c0 6.6-5.4 12-12 12h-8c-6.6 0-12-5.4-12-12v-84h-84c-6.6 0-12-5.4-12-12v-8c0-6.6 5.4-12 12-12h84v-84c0-6.6 5.4-12 12-12h8c6.6 0 12 5.4 12 12v84h84c6.6 0 12 5.4 12 12zm188.5 293L497 508.3c-4.7 4.7-12.3 4.7-17 0l-129-129c-2.3-2.3-3.5-5.3-3.5-8.5v-8.5C310.6 395.7 261.7 416 208 416 93.8 416 1.5 324.9 0 210.7-1.5 93.7 93.7-1.5 210.7 0 324.9 1.5 416 93.8 416 208c0 53.7-20.3 102.6-53.7 139.5h8.5c3.2 0 6.2 1.3 8.5 3.5l129 129c4.7 4.7 4.7 12.3 0 17zM384 208c0-97.3-78.7-176-176-176S32 110.7 32 208s78.7 176 176 176 176-78.7 176-176z"
                ></path>
              </svg>
            </button>
          </div>
        </div>
      </article>

      {showLightbox && (
        <div
          className="p-5 sm:p-10"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'white',
            zIndex: 9999,
            overflow: 'auto'
          }}
          onClick={() => setShowLightbox(false)}
        >
          <button
            onClick={() => setShowLightbox(false)}
            style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              zIndex: 10001
            }}
          >
            <X size={32} color="#212529" strokeWidth={2} />
          </button>

          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <h2 style={{
              fontSize: '32px',
              fontWeight: 400,
              color: '#212529',
              marginBottom: '30px',
              fontFamily: 'acumin-pro-wide, sans-serif'
            }}>
              {property.name}
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: '16px'
            }}>
              {images.map((img, idx) => (
                <div key={idx} style={{ textAlign: 'center' }}>
                  <div style={{ position: 'relative', width: '100%', height: '140px', marginBottom: '8px' }}>
                    <Image
                      src={img}
                      alt={`${property.name} ${idx + 1}`}
                      fill
                      sizes="140px"
                      style={{
                        objectFit: 'cover',
                        cursor: 'pointer',
                        borderRadius: '4px'
                      }}
                      onClick={() => router.push(`/property/${property.id}`)}
                      unoptimized={img.includes('placeholder.com')}
                    />
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: '#6c757d',
                    fontFamily: 'acumin-pro-wide, sans-serif'
                  }}>
                    {idx + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<{ category: string; values: string[] }[]>([]);
  const [searchTerms, setSearchTerms] = useState<{ [key: string]: string }>({});
  const [filterCategories, setFilterCategories] = useState<Record<string, any>>({});
  const [filtersLoading, setFiltersLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [hasPendingSearchChecked, setHasPendingSearchChecked] = useState(false);
  const [mainCategories, setMainCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('');
  const [userType, setUserType] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const ITEMS_PER_PAGE = 8;

  const FILTER_CACHE_KEY = 'sgs_search_filters_cache';
  const CACHE_DURATION = 5 * 60 * 1000;

  const getCachedFilters = () => {
    if (typeof window === 'undefined') return null;
    const cached = localStorage.getItem(FILTER_CACHE_KEY);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const isExpired = Date.now() - timestamp > CACHE_DURATION;

    if (isExpired) {
      localStorage.removeItem(FILTER_CACHE_KEY);
      return null;
    }

    return data;
  };

  const setCachedFilters = (data: any) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(FILTER_CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  };

  useEffect(() => {
    fetchFilters();
    fetchCategories();
    fetchUserType();
  }, []);

  // Fetch user type
  async function fetchUserType() {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setUserType(null);
        return;
      }

      const { data: userData, error } = await (supabase
        .from('users') as any)
        .select('user_type')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user type:', error);
        return;
      }

      if (userData) {
        setUserType(userData.user_type);
      }
    } catch (error) {
      console.error('Error loading user type:', error);
    }
  }

  // Check for pending search save after login/register
  useEffect(() => {
    const checkPendingSearchSave = async () => {
      const pendingData = sessionStorage.getItem('pendingSearchSave');
      if (pendingData) {
        try {
          const {
            name,
            searchInput: savedSearchInput,
            activeFilters: savedFilters,
            selectedCategory: savedCategory,
            selectedSubCategory: savedSubCategory
          } = JSON.parse(pendingData);

          // Check if user is now logged in
          const { data: { user } } = await supabase.auth.getUser();

          if (user) {
            // User is logged in, save the search
            sessionStorage.removeItem('pendingSearchSave');

            // Set the search data (including categories)
            // Note: Setting these will automatically trigger the reset useEffect
            // on line 809 which resets properties, page, and hasMore
            setSearchName(name);
            setSearchInput(savedSearchInput);
            setActiveFilters(savedFilters);
            if (savedCategory) setSelectedCategory(savedCategory);
            if (savedSubCategory) setSelectedSubCategory(savedSubCategory);

            // Mark that we've checked for pending data
            setHasPendingSearchChecked(true);

            // Open save modal and trigger save
            setShowSaveModal(true);

            // Small delay to ensure modal is open, then trigger save
            setTimeout(async () => {
              await handleSaveSearch(true);
            }, 500);
          } else {
            // No user or no pending data, mark as checked
            setHasPendingSearchChecked(true);
          }
        } catch (error) {
          console.error('Error processing pending search save:', error);
          sessionStorage.removeItem('pendingSearchSave');
          setHasPendingSearchChecked(true);
        }
      } else {
        // No pending data, mark as checked
        setHasPendingSearchChecked(true);
      }
    };

    checkPendingSearchSave();
  }, []);

  async function fetchCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order');

      if (error) throw error;

      if (data) {
        // Separate main categories (parent_id is null) and sub-categories
        const mainCats = data.filter((cat: any) => !cat.parent_id);
        const subCats = data.filter((cat: any) => cat.parent_id);

        setMainCategories(mainCats);
        setSubCategories(subCats);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }

  // Separate effect for restoring saved searches
  useEffect(() => {
    const shouldRestore = searchParams.get('restore');
    if (shouldRestore === 'true' && typeof window !== 'undefined') {
      setIsRestoring(true);
      const savedSearchData = sessionStorage.getItem('restoreSearch');
      if (savedSearchData) {
        try {
          const searchCriteria = JSON.parse(savedSearchData);

          console.log('Restoring search with criteria:', searchCriteria);

          // Restore query
          if (searchCriteria.query) {
            setSearchInput(searchCriteria.query);
          }

          // Restore filters - handle both old format (array) and new format (object)
          if (searchCriteria.filters) {
            // New format: filters is an object with tagFilters, category_id, sub_category_id
            if (typeof searchCriteria.filters === 'object' && !Array.isArray(searchCriteria.filters)) {
              if (searchCriteria.filters.tagFilters && Array.isArray(searchCriteria.filters.tagFilters)) {
                setActiveFilters(searchCriteria.filters.tagFilters);
                console.log('Tag filters restored:', searchCriteria.filters.tagFilters);
              }
              if (searchCriteria.filters.category_id) {
                setSelectedCategory(searchCriteria.filters.category_id);
                console.log('Category restored:', searchCriteria.filters.category_id);
              }
              if (searchCriteria.filters.sub_category_id) {
                setSelectedSubCategory(searchCriteria.filters.sub_category_id);
                console.log('Sub-category restored:', searchCriteria.filters.sub_category_id);
              }
            }
            // Old format: filters is an array (backward compatibility)
            else if (Array.isArray(searchCriteria.filters)) {
              setActiveFilters(searchCriteria.filters);
              console.log('Filters restored (old format):', searchCriteria.filters);
            }
          }

          // Mark restoration as complete AFTER state has updated (next tick)
          setTimeout(() => {
            setIsRestoring(false);
            console.log('Restoration complete, isRestoring set to false');
          }, 0);

          // Clear sessionStorage and URL after a short delay
          setTimeout(() => {
            sessionStorage.removeItem('restoreSearch');
            const newParams = new URLSearchParams(window.location.search);
            newParams.delete('restore');
            const newUrl = newParams.toString() ? `/search?${newParams.toString()}` : '/search';
            router.replace(newUrl);
          }, 100);
        } catch (error) {
          console.error('Error restoring saved search:', error);
          sessionStorage.removeItem('restoreSearch');
          setIsRestoring(false);
        }
      } else {
        setIsRestoring(false);
      }
    } else if (!searchParams.get('restore')) {
      // Initialize search input from URL only if not restoring
      const query = searchParams.get('q');
      if (query) {
        setSearchInput(query);
      }

      // Initialize subcategory from URL
      const subcategoryParam = searchParams.get('subcategory');
      if (subcategoryParam && subcategoryParam !== selectedSubCategory) {
        setSelectedSubCategory(subcategoryParam);

        // Also find and set the parent category (only if subCategories is loaded)
        if (subCategories.length > 0) {
          const subCat = subCategories.find((cat: any) => cat.id === subcategoryParam);
          if (subCat && subCat.parent_id) {
            setSelectedCategory(subCat.parent_id);
          }
        }
      }
    }
  }, [searchParams, subCategories, selectedSubCategory]);

  // Ensure parent category is set when subcategory is selected (in case categories loaded late)
  useEffect(() => {
    if (selectedSubCategory && !selectedCategory && subCategories.length > 0) {
      const subCat = subCategories.find((cat: any) => cat.id === selectedSubCategory);
      if (subCat && subCat.parent_id) {
        setSelectedCategory(subCat.parent_id);
      }
    }
  }, [selectedSubCategory, selectedCategory, subCategories]);

  // Debounced search - update URL after user stops typing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const currentQuery = searchParams.get('q') || '';
      if (searchInput !== currentQuery) {
        const newParams = new URLSearchParams(searchParams.toString());
        if (searchInput.trim()) {
          newParams.set('q', searchInput.trim());
        } else {
          newParams.delete('q');
        }
        const newUrl = newParams.toString() ? `/search?${newParams.toString()}` : '/search';
        router.push(newUrl);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  async function fetchFilters() {
    const cached = getCachedFilters();
    if (cached) {
      setFilterCategories(cached);
      setFiltersLoading(false);

      fetchFreshFilters(false);
    } else {
      fetchFreshFilters(true);
    }
  }

  async function fetchFreshFilters(showLoading: boolean) {
    if (showLoading) setFiltersLoading(true);

    try {
      const { data: filtersData, error: filtersError } = await (supabase
        .from('search_filters') as any)
        .select('id, name, slug, has_search')
        .eq('is_active', true)
        .order('display_order');

      if (filtersError) throw filtersError;

      const categoriesObject: Record<string, any> = {};

      const filterPromises = ((filtersData || []) as any[]).map(async (filter: any) => {
        const { data: tagsData, error: tagsError } = await (supabase
          .from('search_filter_tags') as any)
          .select('name, slug')
          .eq('filter_id', filter.id)
          .eq('is_active', true)
          .order('display_order');

        if (!tagsError) {
          return {
            slug: filter.slug,
            data: {
              name: filter.name,
              hasSearch: filter.has_search,
              options: ((tagsData || []) as any[]).map((tag: any) => tag.name)
            }
          };
        }
        return null;
      });

      const results = await Promise.all(filterPromises);

      results.forEach(result => {
        if (result) {
          categoriesObject[result.slug] = result.data;
        }
      });

      setFilterCategories(categoriesObject);
      setCachedFilters(categoriesObject);
    } catch (error) {
      console.error('Error fetching filters:', error);
    } finally {
      if (showLoading) setFiltersLoading(false);
    }
  }

  const loadMoreProperties = async () => {
    if (loading || !hasMore) return;

    console.log('loadMoreProperties called with activeFilters:', activeFilters);
    console.log('Number of active filters:', activeFilters.length);

    setLoading(true);

    try {
      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      const query = searchParams.get('q');
      const categorySlug = searchParams.get('category');

      // Convert category slug to category name if present
      let categoryName: string | null = null;
      if (categorySlug) {
        const { data: categoryData } = await (supabase
          .from('categories') as any)
          .select('name')
          .eq('slug', categorySlug)
          .eq('is_active', true)
          .maybeSingle();

        categoryName = (categoryData as any)?.name || null;
        console.log('Category slug:', categorySlug, '-> name:', categoryName);
      }

      const categoryParam = categoryName;

      // If no filters are active and no category/query, show all active properties
      if (activeFilters.length === 0 && !query && !categoryParam && !selectedCategory && !selectedSubCategory) {
        console.log('Loading all properties (no filters)');

        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .eq('status', 'active')
          .order('is_exclusive', { ascending: false, nullsFirst: false })
          .order('name', { ascending: true })
          .range(from, to);

        if (error) throw error;

        if (data && data.length > 0) {
          setProperties(prev => [...prev, ...data]);
          setPage(prev => prev + 1);
          if (data.length < ITEMS_PER_PAGE) {
            setHasMore(false);
          }
        } else {
          setHasMore(false);
        }

        setLoading(false);
        return;
      }

      // Handle category filter from URL or dropdowns (without other filters)
      if ((categoryParam || selectedCategory || selectedSubCategory) && activeFilters.length === 0 && !query) {
        console.log('Loading properties by category:', { categoryParam, selectedCategory, selectedSubCategory });

        let categoryQuery = supabase
          .from('properties')
          .select('*')
          .eq('status', 'active');

        if (categoryParam) {
          categoryQuery = categoryQuery.contains('categories', [categoryParam]);
        }

        if (selectedCategory) {
          categoryQuery = categoryQuery.eq('category_id', selectedCategory);
        }

        if (selectedSubCategory) {
          categoryQuery = categoryQuery.eq('sub_category_id', selectedSubCategory);
        }

        const { data, error } = await categoryQuery
          .order('is_exclusive', { ascending: false, nullsFirst: false })
          .order('name', { ascending: true })
          .range(from, to);

        if (error) throw error;

        if (data && data.length > 0) {
          setProperties(prev => [...prev, ...data]);
          setPage(prev => prev + 1);
          if (data.length < ITEMS_PER_PAGE) {
            setHasMore(false);
          }
        } else {
          setHasMore(false);
        }

        setLoading(false);
        return;
      }

      // Build array of selected tag names from all active filters
      const selectedTags: string[] = [];
      activeFilters.forEach(filter => {
        selectedTags.push(...filter.values);
      });

      console.log('Searching with tags:', selectedTags);

      // If we have tag filters, search property_images table
      if (selectedTags.length > 0) {
        // Find properties that have images matching ANY selected tags (OR logic)
        // Collect all property IDs that have any of the selected tags
        const allPropertyIds = new Set<string>();

        for (const tag of selectedTags) {
          const { data: tagImages, error: tagError } = await (supabase
            .from('property_images') as any)
            .select('property_id')
            .contains('tags', [tag]);

          if (tagError) throw tagError;

          // Add all property IDs that have this tag to our set
          (tagImages as any[] || []).forEach((img: any) => {
            allPropertyIds.add(img.property_id);
          });
        }

        // Convert set to array - properties that have ANY of the selected tags
        const propertyIds: string[] = Array.from(allPropertyIds);

        // Now get the matching images for display
        const { data: propertyImages } = await (supabase
          .from('property_images') as any)
          .select('property_id, image_url, tags')
          .in('property_id', propertyIds)
          .overlaps('tags', selectedTags);

        const matchingImagesByProperty = new Map<string, string[]>();
        (propertyImages as any[] || []).forEach((img: any) => {
          if (!matchingImagesByProperty.has(img.property_id)) {
            matchingImagesByProperty.set(img.property_id, []);
          }
          matchingImagesByProperty.get(img.property_id)!.push(img.image_url);
        });

        console.log('Found properties with ANY matching tags:', propertyIds.length);

        if (propertyIds.length === 0) {
          setHasMore(false);
          setLoading(false);
          return;
        }

        // Fetch the actual properties
        let unsortedData;
        let error;

        if (query && query.trim()) {
          // Apply text search using RPC function, then filter by property IDs
          const { data: searchData, error: searchError } = await (supabase as any)
            .rpc('search_properties', { search_query: query.trim() });

          error = searchError;

          if (searchData) {
            // Filter to only include properties that also match the tag filters
            unsortedData = searchData.filter((prop: Property) => propertyIds.includes(prop.id));
          }
        } else {
          // No text search, just fetch properties by IDs
          let query = supabase
            .from('properties')
            .select('*')
            .eq('status', 'active')
            .in('id', propertyIds);

          // Apply category filter if present
          if (categoryParam) {
            query = query.contains('categories', [categoryParam]);
          }

          // Apply main category filter
          if (selectedCategory) {
            query = query.eq('category_id', selectedCategory);
          }

          // Apply sub-category filter
          if (selectedSubCategory) {
            query = query.eq('sub_category_id', selectedSubCategory);
          }

          const { data, error: fetchError } = await query;

          unsortedData = data;
          error = fetchError;
        }

        if (error) throw error;

        // Sort by exclusivity and name, then apply pagination
        if (unsortedData && unsortedData.length > 0) {
          const sortedData = sortLocationsByExclusivity(unsortedData);

          // Attach matching images to each property
          const dataWithMatchingImages = sortedData.map(prop => ({
            ...prop,
            matchingImages: matchingImagesByProperty.get(prop.id) || []
          }));

          const paginatedData = dataWithMatchingImages.slice(from, to + 1);

          setProperties(prev => [...prev, ...paginatedData]);
          setPage(prev => prev + 1);
          if (paginatedData.length < ITEMS_PER_PAGE) {
            setHasMore(false);
          }
        } else {
          setHasMore(false);
        }
      } else if (query && query.trim()) {
        // Just text search, no tag filters - use RPC function to search including property_tags
        const { data: searchData, error } = await (supabase as any)
          .rpc('search_properties', { search_query: query.trim() });

        if (error) {
          console.error('RPC search error:', error);
          throw error;
        }

        let filteredData = searchData;

        // Apply category filter if present
        if (categoryParam && searchData) {
          filteredData = searchData.filter((prop: Property) =>
            prop.categories && prop.categories.includes(categoryParam)
          );
        }

        if (filteredData && filteredData.length > 0) {
          const paginatedData = filteredData.slice(from, to + 1);
          setProperties(prev => [...prev, ...paginatedData]);
          setPage(prev => prev + 1);
          if (paginatedData.length < ITEMS_PER_PAGE) {
            setHasMore(false);
          }
        } else {
          setHasMore(false);
        }
      } else {
        // No filters, no query - show all active properties (this shouldn't be reached if category is present)
        let query = supabase
          .from('properties')
          .select('*')
          .eq('status', 'active');

        // Apply category filter if present (though this case should be handled above)
        if (categoryParam) {
          query = query.contains('categories', [categoryParam]);
        }

        const { data, error } = await query
          .order('is_exclusive', { ascending: false, nullsFirst: false })
          .order('name', { ascending: true })
          .range(from, to);

        if (error) throw error;

        if (data && data.length > 0) {
          setProperties(prev => [...prev, ...data]);
          setPage(prev => prev + 1);
          if (data.length < ITEMS_PER_PAGE) {
            setHasMore(false);
          }
        } else {
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error('Error loading properties:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Reset and reload when search params, filters, or categories change
    console.log('Resetting search state due to filter/param change');
    setProperties([]);
    setPage(1);
    setHasMore(true);
    setLoading(false); // Reset loading state to allow new search
  }, [searchParams, activeFilters, selectedCategory, selectedSubCategory]);

  // Trigger search when needed
  useEffect(() => {
    // Don't load if we're currently restoring a saved search
    const shouldRestore = searchParams.get('restore');
    if (shouldRestore === 'true') {
      console.log('Skipping load - restoration in progress');
      return;
    }

    // Don't load until we've checked for pending search data (after registration)
    if (!hasPendingSearchChecked) {
      console.log('Skipping load - waiting for pending search check');
      return;
    }

    // Trigger load when:
    // 1. We have no properties
    // 2. We're on page 1
    // 3. We're not currently loading
    // 4. We think there might be more results
    // 5. We're not restoring
    // 6. We've checked for pending search data
    if (page === 1 && properties.length === 0 && !loading && hasMore && !isRestoring) {
      console.log('Triggering load - activeFilters:', activeFilters.length, 'filters:', activeFilters);
      loadMoreProperties();
    }
  }, [page, properties.length, loading, hasMore, isRestoring, searchParams, activeFilters, hasPendingSearchChecked]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      if (scrollTop + windowHeight >= documentHeight - 500) {
        if (!loading && hasMore) {
          loadMoreProperties();
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, hasMore]);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    // Use a small timeout to prevent immediate closing when opening
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [openDropdown]);

  const toggleFilter = (category: string, value: string) => {
    setActiveFilters(prev => {
      const existingFilter = prev.find(f => f.category === category);
      if (existingFilter) {
        const newValues = existingFilter.values.includes(value)
          ? existingFilter.values.filter(v => v !== value)
          : [...existingFilter.values, value];

        if (newValues.length === 0) {
          return prev.filter(f => f.category !== category);
        }

        return prev.map(f =>
          f.category === category ? { ...f, values: newValues } : f
        );
      }
      return [...prev, { category, values: [value] }];
    });
  };

  const isFilterActive = (category: string, value: string) => {
    const filter = activeFilters.find(f => f.category === category);
    return filter ? filter.values.includes(value) : false;
  };

  const removeFilterValue = (category: string, value: string) => {
    toggleFilter(category, value);
    window.scrollTo(0, 0);
  };

  const clearCategoryFilters = (category: string) => {
    setActiveFilters(prev => prev.filter(f => f.category !== category));
    window.scrollTo(0, 0);
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
    window.scrollTo(0, 0);
  };

  const getFilteredOptions = (categoryKey: string, options: string[]) => {
    const searchTerm = searchTerms[categoryKey]?.toLowerCase() || '';
    if (!searchTerm) return options;
    return options.filter(option => option.toLowerCase().includes(searchTerm));
  };

  const handleSaveSearch = async (skipAuthCheck = false) => {
    if (!searchName.trim()) {
      setSaveMessage('Please enter a name for your search');
      return;
    }

    setIsSaving(true);
    setSaveMessage('');

    try {
      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser();

      if (!user && !skipAuthCheck) {
        setSaveMessage('Please Login or Register to save searches');
        setIsSaving(false);
        return;
      }

      if (!user) {
        setIsSaving(false);
        return;
      }

      // Calculate result count by running the search
      let resultCount = 0;
      const selectedTags: string[] = [];
      activeFilters.forEach(filter => {
        selectedTags.push(...filter.values);
      });

      if (selectedTags.length > 0) {
        // Search with filters using AND logic (properties must have ALL tags)
        const propertyIdSets: Set<string>[] = [];

        for (const tag of selectedTags) {
          const { data: tagImages } = await (supabase
            .from('property_images') as any)
            .select('property_id')
            .contains('tags', [tag]);

          const propertyIdsForTag = new Set((tagImages as any[] || []).map((img: any) => img.property_id));
          propertyIdSets.push(propertyIdsForTag);
        }

        // Find intersection - properties that have ALL tags
        let propertyIds: string[] = [];
        if (propertyIdSets.length > 0) {
          let intersection = Array.from(propertyIdSets[0]);
          for (let i = 1; i < propertyIdSets.length; i++) {
            const currentSet = propertyIdSets[i];
            intersection = intersection.filter(id => currentSet.has(id));
          }
          propertyIds = intersection;
        }

        if (propertyIds.length > 0) {
          if (searchInput && searchInput.trim()) {
            const { data: searchData } = await (supabase as any)
              .rpc('search_properties', { search_query: searchInput.trim() });

            // Filter by property IDs and categories
            let filteredResults = searchData?.filter((prop: any) => propertyIds.includes(prop.id)) || [];
            if (selectedCategory) {
              filteredResults = filteredResults.filter((prop: any) => prop.category_id === selectedCategory);
            }
            if (selectedSubCategory) {
              filteredResults = filteredResults.filter((prop: any) => prop.sub_category_id === selectedSubCategory);
            }
            resultCount = filteredResults.length;
          } else {
            // Build query with category filters
            let query = (supabase
              .from('properties') as any)
              .select('id')
              .eq('status', 'active')
              .in('id', propertyIds);

            // Apply category filters
            if (selectedCategory) {
              query = query.eq('category_id', selectedCategory);
            }
            if (selectedSubCategory) {
              query = query.eq('sub_category_id', selectedSubCategory);
            }

            const { data } = await query;
            resultCount = data?.length || 0;
          }
        }
      } else if (searchInput && searchInput.trim()) {
        // Text search with optional category filters
        const { data } = await (supabase as any)
          .rpc('search_properties', { search_query: searchInput.trim() });

        // Apply category filters to results
        let filteredResults = data || [];
        if (selectedCategory) {
          filteredResults = filteredResults.filter((prop: any) => prop.category_id === selectedCategory);
        }
        if (selectedSubCategory) {
          filteredResults = filteredResults.filter((prop: any) => prop.sub_category_id === selectedSubCategory);
        }
        resultCount = filteredResults.length;
      } else {
        // No tag filters, no text search - but might have category filters
        let query = supabase
          .from('properties')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        // Apply category filters if present
        if (selectedCategory) {
          query = query.eq('category_id', selectedCategory);
        }
        if (selectedSubCategory) {
          query = query.eq('sub_category_id', selectedSubCategory);
        }

        const { count } = await query;
        resultCount = count || 0;
      }

      // Prepare filter tags array (just the tag names)
      const filterTagNames = selectedTags;

      // Prepare filters object including tag filters AND category selections
      const filtersToSave = {
        tagFilters: activeFilters,
        category_id: selectedCategory || null,
        sub_category_id: selectedSubCategory || null,
      };

      // Save to database
      const { error } = await (supabase
        .from('saved_searches') as any)
        .insert({
          user_id: user.id,
          name: searchName.trim(),
          search_text: searchInput || null,
          filters: filtersToSave,
          tags: filterTagNames,
          result_count: resultCount,
          last_checked_at: new Date().toISOString(),
        });

      if (error) throw error;

      setSaveMessage('Search saved successfully!');
      setTimeout(() => {
        setShowSaveModal(false);
        setSearchName('');
        setSaveMessage('');
      }, 1500);
    } catch (error: any) {
      console.error('Error saving search:', error);
      setSaveMessage('Error saving search. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@200;300;400;500;600&display=swap');

        .search-page {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background: #fff;
          min-height: 100vh;
          padding-top: 4rem;
        }

        @media (min-width: 768px) {
          .search-page {
            padding-top: 5rem;
          }
        }

        @media (min-width: 1024px) {
          .search-page {
            padding-top: 7rem;
          }
        }

        .filter-bar {
          background: white;
          border-bottom: 1px solid #e5e5e5;
          padding: 12px 15px;
        }

        @media (min-width: 768px) {
          .filter-bar {
            padding: 12px 20px;
          }
        }

        .filter-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          max-width: 1200px;
          margin: 0 auto;
          overflow: visible;
        }

        @media (min-width: 768px) {
          .filter-row {
            gap: 15px;
          }
        }

        .filter-dropdown {
          position: relative;
        }

        .dropdown-toggle {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 8px 12px;
          background: white;
          border: 1px solid #ced4da;
          border-radius: 3px;
          cursor: pointer;
          font-size: 14px;
          color: #6c757d;
          transition: all 0.2s;
        }

        .dropdown-toggle:hover {
          background: #f8f9fa;
        }

        .dropdown-toggle.has-active {
          background: #e11921;
          color: white;
          border-color: #e11921;
        }

        .dropdown-menu {
          position: absolute;
          top: calc(100% + 5px);
          left: 0;
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          box-shadow: 0 6px 12px rgba(0,0,0,0.175);
          min-width: 240px;
          max-width: calc(100vw - 40px);
          width: 280px;
          z-index: 1050;
          display: flex;
          flex-direction: column;
        }

        @media (min-width: 640px) {
          .dropdown-menu {
            min-width: 280px;
            max-width: 350px;
          }
        }

        .dropdown-search {
          padding: 10px 15px;
          border-bottom: 1px solid #dee2e6;
        }

        .dropdown-search input {
          width: 100%;
          padding: 6px 10px 6px 32px;
          border: 1px solid #ced4da;
          border-radius: 3px;
          font-size: 14px;
          font-family: acumin-pro-wide, sans-serif;
        }

        .dropdown-search-wrapper {
          position: relative;
        }

        .dropdown-search-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: #6b7280;
        }

        .dropdown-options-wrapper {
          max-height: 400px;
          overflow-y: auto;
        }

        .dropdown-footer {
          padding: 10px 15px;
          border-top: 1px solid #dee2e6;
          display: flex;
          justify-content: space-between;
          gap: 10px;
        }

        .dropdown-footer button {
          padding: 6px 12px;
          border-radius: 3px;
          font-size: 14px;
          cursor: pointer;
          font-family: acumin-pro-wide, sans-serif;
          font-weight: 400;
          transition: all 0.2s;
        }

        .clear-btn {
          background: white;
          border: 1px solid #ced4da;
          color: #495057;
        }

        .clear-btn:hover {
          background: #f8f9fa;
        }

        .done-btn {
          background: #e11921;
          border: 1px solid #e11921;
          color: white;
        }

        .done-btn:hover {
          background: #c41519;
        }

        .clear-all-btn {
          padding: 6px 12px;
          background: #e11921;
          border: 1px solid #e11921;
          color: white;
          border-radius: 3px;
          font-size: 14px;
          cursor: pointer;
          font-family: acumin-pro-wide, sans-serif;
          font-weight: 400;
          transition: all 0.2s;
        }

        .clear-all-btn:hover {
          background: #c41519;
        }

        .dropdown-header {
          padding: 10px 15px;
          background: #f8f9fa;
          border-bottom: 1px solid #dee2e6;
          font-weight: 600;
          color: #495057;
          font-size: 14px;
        }

        .dropdown-content {
          padding: 8px 0;
        }

        .option-item {
          padding: 8px 15px;
          display: flex;
          align-items: center;
          cursor: pointer;
          transition: background-color 0.2s;
          font-size: 14px;
        }

        .option-item:hover {
          background-color: #f8f9fa;
        }

        .toggle-switch {
          width: 40px;
          height: 20px;
          background-color: #ccc;
          border-radius: 10px;
          position: relative;
          transition: background-color 0.3s;
          margin-right: 10px;
          flex-shrink: 0;
        }

        .toggle-switch.active {
          background-color: #e11921;
        }

        .toggle-switch::after {
          content: '';
          position: absolute;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background-color: white;
          top: 2px;
          left: 2px;
          transition: transform 0.3s;
        }

        .toggle-switch.active::after {
          transform: translateX(20px);
        }

        .option-text {
          flex: 1;
          color: #495057;
        }

        .option-count {
          color: #6c757d;
          font-size: 12px;
        }

        .main-search-container {
          padding: 15px;
          background: #f8f9fa;
        }

        @media (min-width: 768px) {
          .main-search-container {
            padding: 20px;
          }
        }

        .main-search-wrapper {
          max-width: 1200px;
          margin: 0 auto;
          position: relative;
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .main-search-input {
          flex: 1;
          padding: 12px 15px 12px 35px;
          border: 1px solid #ced4da;
          border-radius: 3px;
          font-size: 16px;
        }

        @media (min-width: 768px) {
          .main-search-input {
            padding: 12px 40px 12px 45px;
          }
        }

        .main-search-icon {
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
          color: #6c757d;
        }

        .save-search-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          background: #e11921;
          color: white;
          border: none;
          border-radius: 3px;
          font-size: 14px;
          font-family: acumin-pro-wide, sans-serif;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
          white-space: nowrap;
        }

        .save-search-btn span {
          display: none;
        }

        @media (min-width: 640px) {
          .save-search-btn {
            padding: 12px 20px;
          }

          .save-search-btn span {
            display: inline;
          }
        }

        .save-search-btn:hover {
          background: #c41519;
        }

        .save-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 20px;
        }

        .save-modal {
          background: white;
          border-radius: 8px;
          max-width: 500px;
          width: 100%;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }

        .save-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #e5e5e5;
        }

        .save-modal-header h3 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          font-family: acumin-pro-wide, sans-serif;
          color: #212529;
        }

        .close-modal-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #6c757d;
          padding: 0;
          display: flex;
          align-items: center;
          transition: color 0.2s;
        }

        .close-modal-btn:hover {
          color: #212529;
        }

        .save-modal-body {
          padding: 20px;
        }

        .save-modal-body label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: #495057;
          margin-bottom: 8px;
          font-family: acumin-pro-wide, sans-serif;
        }

        .save-modal-body input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          font-size: 14px;
          font-family: acumin-pro-wide, sans-serif;
          transition: border-color 0.2s;
        }

        .save-modal-body input:focus {
          outline: none;
          border-color: #e11921;
          box-shadow: 0 0 0 3px rgba(225, 25, 33, 0.1);
        }

        .save-message {
          margin-top: 12px;
          padding: 10px;
          border-radius: 4px;
          font-size: 14px;
          font-family: acumin-pro-wide, sans-serif;
        }

        .save-message.success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .save-message.error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .save-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 20px;
          border-top: 1px solid #e5e5e5;
        }

        .save-modal-footer button {
          padding: 10px 20px;
          border-radius: 4px;
          font-size: 14px;
          font-family: acumin-pro-wide, sans-serif;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .cancel-btn {
          background: white;
          border: 1px solid #ced4da;
          color: #495057;
        }

        .cancel-btn:hover {
          background: #f8f9fa;
        }

        .save-btn {
          background: #e11921;
          border: 1px solid #e11921;
          color: white;
        }

        .save-btn:hover:not(:disabled) {
          background: #c41519;
        }

        .save-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .filter-pills {
          padding: 15px 20px;
          background: white;
          border-bottom: 1px solid #e5e5e5;
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .filter-pill-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .filter-label {
          font-size: 14px;
          color: #495057;
          font-weight: 500;
          font-family: acumin-pro-wide, sans-serif;
        }

        .filter-value {
          background: white;
          color: #495057;
          padding: 4px 10px;
          border: 1px solid #e5e7eb;
          border-radius: 3px;
          font-size: 13px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }

        .filter-remove {
          background: none;
          border: none;
          color: #e11921;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
        }

        .filter-tag,
        .active-filter-tag {
          background-color: #dc2626 !important;
          color: white !important;
          padding: 6px 12px !important;
          border-radius: 20px !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 8px !important;
          font-size: 14px !important;
          font-weight: 500 !important;
          font-family: acumin-pro-wide, sans-serif !important;
          margin-right: 8px !important;
          margin-bottom: 8px !important;
        }

        .filter-tag:hover,
        .active-filter-tag:hover {
          background-color: #b91c1c !important;
        }

        .filter-tag button,
        .active-filter-tag button,
        .filter-tag .remove-btn,
        .active-filter-tag .remove-btn {
          background: none !important;
          border: none !important;
          color: white !important;
          cursor: pointer !important;
          padding: 0 !important;
          margin-left: 4px !important;
          font-size: 16px !important;
        }


        .swiper-button-prev,
        .swiper-button-next {
          position: absolute !important;
          top: 0 !important;
          bottom: 18px !important;
          width: 60px !important;
          height: calc(100% - 18px) !important;
          margin-top: 0 !important;
          z-index: 10 !important;
          cursor: pointer !important;
          color: white !important;
        }

        .swiper-button-prev,
        .swiper-button-next {
          position: absolute !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
          width: 60px !important;
          height: min(50px, 40%) !important;
          z-index: 10 !important;
          cursor: pointer !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }

        @media (min-width: 768px) {
          .swiper-button-prev,
          .swiper-button-next {
            width: 96px !important;
          }
        }

        .swiper-button-prev {
          left: 0 !important;
          right: auto !important;
          background: linear-gradient(90deg, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0)) !important;
        }

        .swiper-button-next {
          right: 0 !important;
          left: auto !important;
          background: linear-gradient(270deg, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0)) !important;
        }

        .swiper-button-prev:hover {
          background: linear-gradient(90deg, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0)) !important;
        }

        .swiper-button-next:hover {
          background: linear-gradient(270deg, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0)) !important;
        }

        .swiper-button-prev:after,
        .swiper-button-next:after {
          font-family: swiper-icons !important;
          font-size: 20.8px !important;
          font-weight: 400 !important;
          line-height: 20.8px !important;
          margin-left: -3.2px !important;
          -webkit-font-smoothing: antialiased !important;
          display: block !important;
          color: rgb(255, 255, 255) !important;
        }

        .swiper-scrollbar {
          position: absolute !important;
          background: rgb(222, 226, 230) !important;
          border-radius: 10px !important;
          bottom: 4px !important;
          height: 8px !important;
          left: 1% !important;
          width: 98% !important;
          z-index: 50 !important;
        }

        .swiper-scrollbar-drag {
          background: rgb(225, 25, 33) !important;
          border-radius: 10px !important;
          height: 8px !important;
          width: 6.15625px !important;
          cursor: grab !important;
          position: relative !important;
        }

        .swiper-scrollbar-drag:active {
          cursor: grabbing !important;
        }

        .swiper-container-wrapper {
          position: relative;
          width: 100%;
          max-width: 100%;
          overflow: hidden;
        }

        .il-search-result {
          background: white;
          overflow: hidden;
        }

        .property-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 15px;
          padding: 15px;
          max-width: 1425px;
          margin: 0 auto;
          overflow-x: hidden;
        }

        @media (min-width: 768px) {
          .property-grid {
            gap: 20px;
            padding: 20px;
          }
        }

        @media (min-width: 640px) {
          .property-grid {
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          }
        }

        @media (min-width: 1024px) {
          .property-grid {
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          }
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #f3f4f6;
          border-top: 3px solid #e11921;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .no-results {
          grid-column: 1 / -1;
          text-align: center;
          padding: 4rem 2rem;
          color: #6b7280;
        }

        .no-results-title {
          font-size: 1.25rem;
          margin-bottom: 0.5rem;
          font-family: acumin-pro-wide, sans-serif;
          font-weight: 400;
        }

        .no-results-text {
          font-size: 0.875rem;
          font-family: acumin-pro-wide, sans-serif;
          font-weight: 300;
        }

        .loading-container {
          grid-column: 1 / -1;
          display: flex;
          justify-content: center;
          padding: 2rem 0;
        }

        .end-message {
          grid-column: 1 / -1;
          text-align: center;
          padding: 2rem 0;
          color: #6b7280;
          font-size: 14px;
          font-weight: 300;
          font-family: acumin-pro-wide, sans-serif;
        }

        .results-count {
          padding: 15px 20px;
          background: white;
          border-bottom: 1px solid #e5e5e5;
          max-width: 1200px;
          margin: 0 auto;
        }

        .results-count p {
          color: #6b7280;
          font-size: 14px;
          font-weight: 300;
          font-family: acumin-pro-wide, sans-serif;
          margin: 0;
        }
      `}</style>

      <div className="search-page">
        <div className="filter-bar">
          <div className="filter-row">
            {/* Main Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedSubCategory(''); // Reset sub-category when main category changes
                setProperties([]);
                setPage(1);
                setHasMore(true);
              }}
              className="category-select"
              style={{
                padding: '8px 12px',
                background: selectedCategory ? '#e11921' : 'white',
                border: '1px solid #ced4da',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '14px',
                color: selectedCategory ? 'white' : '#6c757d',
                transition: 'all 0.2s',
                fontFamily: 'acumin-pro-wide, sans-serif'
              }}
            >
              <option value="">All Categories</option>
              {mainCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            {/* Sub-Category Dropdown */}
            <select
              value={selectedSubCategory}
              onChange={(e) => {
                setSelectedSubCategory(e.target.value);
                setProperties([]);
                setPage(1);
                setHasMore(true);
              }}
              className="category-select"
              disabled={!selectedCategory}
              style={{
                padding: '8px 12px',
                background: selectedSubCategory ? '#e11921' : 'white',
                border: '1px solid #ced4da',
                borderRadius: '3px',
                cursor: selectedCategory ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                color: selectedSubCategory ? 'white' : '#6c757d',
                transition: 'all 0.2s',
                opacity: selectedCategory ? 1 : 0.6,
                fontFamily: 'acumin-pro-wide, sans-serif'
              }}
            >
              <option value="">All Sub-Categories</option>
              {subCategories
                .filter((subCat: any) => subCat.parent_id === selectedCategory)
                .map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
            </select>

            {Object.entries(filterCategories).map(([key, category]) => {
              const hasActive = activeFilters.find(f => f.category === category.name)?.values.length || 0;
              const filteredOptions = getFilteredOptions(key, category.options);

              const containerRef = openDropdown === key ? dropdownRef : null;

              return (
                <div
                  key={key}
                  className="filter-dropdown"
                  ref={containerRef}
                >
                  <button
                    type="button"
                    className={`dropdown-toggle ${hasActive > 0 ? 'has-active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenDropdown(openDropdown === key ? null : key);
                    }}
                  >
                    <span>{category.name}</span>
                    <ChevronDown size={16} />
                  </button>

                  {openDropdown === key && (
                    <div className="dropdown-menu">
                      <div className="dropdown-header">{category.name}</div>

                      {category.hasSearch && (
                        <div className="dropdown-search">
                          <div className="dropdown-search-wrapper">
                            <Search className="dropdown-search-icon" size={16} />
                            <input
                              type="text"
                              placeholder="Search..."
                              value={searchTerms[key] || ''}
                              onChange={(e) => setSearchTerms(prev => ({ ...prev, [key]: e.target.value }))}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                      )}

                      <div className="dropdown-options-wrapper">
                        <div className="dropdown-content">
                          {filteredOptions.map((option, idx) => (
                            <div
                              key={idx}
                              className="option-item"
                              onClick={() => toggleFilter(category.name, option)}
                            >
                              <div className={`toggle-switch ${isFilterActive(category.name, option) ? 'active' : ''}`} />
                              <span className="option-text">{option}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="dropdown-footer">
                        <button type="button" className="clear-btn" onClick={(e) => { e.stopPropagation(); clearCategoryFilters(category.name); }}>
                          Clear
                        </button>
                        <button type="button" className="done-btn" onClick={(e) => { e.stopPropagation(); setOpenDropdown(null); }}>
                          Done
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="main-search-container">
          <div className="main-search-wrapper">
            <Search className="main-search-icon" size={20} />
            <input
              type="text"
              className="main-search-input"
              placeholder="Search locations by name, city, or tags..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {/* Only show Save Search button for non-property owners */}
            {userType !== 'property_owner' && (
              <button
                type="button"
                className="save-search-btn"
                onClick={() => setShowSaveModal(true)}
                title="Save this search"
              >
                <Bookmark size={20} />
                <span>Save Search</span>
              </button>
            )}
          </div>
        </div>

        {activeFilters.length > 0 && (
          <div className="filter-pills">
            {activeFilters.map(filter => (
              <div key={filter.category} className="filter-pill-group">
                <span className="filter-label">{filter.category}:</span>
                {filter.values.map(value => (
                  <span key={value} className="filter-tag">
                    {value}
                    <button
                      className="remove-btn"
                      onClick={() => removeFilterValue(filter.category, value)}
                    >
                      <X size={14} strokeWidth={2} />
                    </button>
                  </span>
                ))}
              </div>
            ))}
          </div>
        )}

        <div className="results-count">
          <p>
            Showing {properties.length} {properties.length === 1 ? 'property' : 'properties'}
            {!hasMore && properties.length > 0 && ' (all results loaded)'}
          </p>
        </div>

        <div className="property-grid">
          {properties.map(property => (
            <PropertyCard key={property.id} property={property} />
          ))}

          {loading && (
            <div className="loading-container">
              <div className="loading-spinner" />
            </div>
          )}

          {!loading && properties.length === 0 && (
            <div className="no-results">
              <p className="no-results-title">No properties found</p>
              <p className="no-results-text">Try adjusting your filters</p>
            </div>
          )}

          {!hasMore && properties.length > 0 && (
            <div className="end-message">
              No more properties to load
            </div>
          )}
        </div>

        {/* Save Search Modal */}
        {showSaveModal && (
          <div className="save-modal-overlay" onClick={() => setShowSaveModal(false)}>
            <div className="save-modal" onClick={(e) => e.stopPropagation()}>
              <div className="save-modal-header">
                <h3>Save This Search</h3>
                <button onClick={() => setShowSaveModal(false)} className="close-modal-btn">
                  <X size={24} />
                </button>
              </div>
              <div className="save-modal-body">
                <label htmlFor="searchName">Search Name</label>
                <input
                  id="searchName"
                  type="text"
                  placeholder="e.g., Commercial Properties with Airport"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSaveSearch(false)}
                  autoFocus
                />
                {saveMessage && (
                  <div>
                    <p className={`save-message ${saveMessage.includes('success') ? 'success' : 'error'}`}>
                      {saveMessage}
                    </p>
                    {saveMessage.includes('Login or Register') && (
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'center' }}>
                        <button
                          onClick={() => {
                            setShowSaveModal(false);
                            setIsLoginModalOpen(true);
                          }}
                          style={{
                            padding: '0.5rem 1rem',
                            background: '#e11921',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 500
                          }}
                        >
                          Login
                        </button>
                        <button
                          onClick={() => {
                            // Store search data to save after registration (including categories)
                            sessionStorage.setItem('pendingSearchSave', JSON.stringify({
                              name: searchName,
                              searchInput: searchInput,
                              activeFilters: activeFilters,
                              selectedCategory: selectedCategory,
                              selectedSubCategory: selectedSubCategory,
                              returnUrl: window.location.pathname + window.location.search
                            }));
                            setShowSaveModal(false);
                            router.push('/register');
                          }}
                          style={{
                            padding: '0.5rem 1rem',
                            background: 'white',
                            color: '#e11921',
                            border: '2px solid #e11921',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 500
                          }}
                        >
                          Register
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="save-modal-footer">
                <button onClick={() => setShowSaveModal(false)} className="cancel-btn">
                  Cancel
                </button>
                <button onClick={() => handleSaveSearch(false)} disabled={isSaving} className="save-btn">
                  {isSaving ? 'Saving...' : 'Save Search'}
                </button>
              </div>
            </div>
          </div>
        )}

        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onSuccess={async () => {
            setIsLoginModalOpen(false);
            // Reopen the save modal to show the success message
            setShowSaveModal(true);
            // Small delay to ensure modal is visible before showing message
            setTimeout(async () => {
              await handleSaveSearch(true);
            }, 100);
          }}
        />
      </div>
    </>
  );
}
