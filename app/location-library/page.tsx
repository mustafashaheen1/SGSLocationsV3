'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus, Menu, X } from 'lucide-react';
import { supabase, Property } from '@/lib/supabase';

function PropertyCard({ property }: { property: Property }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  const images = property.images.length > 0 ? property.images : [property.primary_image || ''];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 group relative">
      <div
        className="relative aspect-[4/3] overflow-hidden"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <Link href={`/property/${property.id}`}>
          <Image
            src={images[currentImageIndex]}
            alt={property.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </Link>

        {images.length > 1 && isHovering && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all z-10"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5 text-gray-800" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all z-10"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5 text-gray-800" />
            </button>
          </>
        )}

        {images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
            {images.map((_, index) => (
              <div
                key={index}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  index === currentImageIndex ? 'bg-white w-3' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <button
        className="absolute top-3 right-3 w-8 h-8 bg-white border-2 border-[#dc2626] rounded-full flex items-center justify-center hover:bg-[#dc2626] hover:border-[#dc2626] transition-all z-20 group/btn"
        aria-label="Add to favorites"
      >
        <Plus className="w-4 h-4 text-[#dc2626] group-hover/btn:text-white" />
      </button>

      <div className="p-4">
        <Link href={`/property/${property.id}`}>
          <h3 className="text-lg font-semibold text-gray-900 mb-1 hover:text-[#dc2626] transition-colors">
            {property.name}
          </h3>
        </Link>
        <p className="text-sm text-gray-600">{property.city}, Texas</p>
      </div>
    </div>
  );
}

export default function LocationLibraryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('exclusives');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const categories = [
    { id: 'exclusives', label: 'Exclusives' },
    { id: 'new', label: 'New' },
    { id: 'most-viewed', label: 'Most Viewed' },
    { id: 'top-categories', label: 'Top Categories' },
    { id: 'all', label: 'All Categories' },
  ];

  useEffect(() => {
    const category = searchParams.get('category') || 'exclusives';
    setActiveCategory(category);
    fetchProperties(category);
  }, [searchParams]);

  const fetchProperties = async (category: string) => {
    setLoading(true);
    let query = supabase.from('properties').select('*').eq('status', 'active');

    if (category === 'exclusives') {
      query = query.in('categories', ['Luxury']);
    } else if (category === 'new') {
      query = query.order('created_at', { ascending: false }).limit(20);
    } else if (category === 'most-viewed') {
      query = query.order('created_at', { ascending: false }).limit(20);
    }

    const { data } = await query;
    setProperties(data || []);
    setLoading(false);
  };

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    setMobileMenuOpen(false);
    router.push(`/location-library?category=${categoryId}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getCategoryTitle = () => {
    return categories.find(c => c.id === activeCategory)?.label || 'Exclusives';
  };

  const getSectionTitle = () => {
    const title = getCategoryTitle();
    if (activeCategory === 'top-categories') {
      return 'Top Categories';
    }
    return `All ${title} Locations`;
  };

  const CategoryButton = ({ category }: { category: typeof categories[0] }) => (
    <button
      onClick={() => handleCategoryChange(category.id)}
      className={`w-full text-left py-4 px-6 text-sm font-normal transition-colors ${
        activeCategory === category.id
          ? 'bg-[#dc2626] text-white'
          : 'bg-white text-gray-700 hover:bg-gray-100'
      }`}
    >
      {category.label}
    </button>
  );

  return (
    <main className="min-h-screen bg-[#f8f9fa] pt-[110px]">
      <div className="flex">
        <aside className="hidden lg:block w-[200px] bg-white border-r border-gray-200 min-h-[calc(100vh-110px)] sticky top-[110px]">
          <nav className="flex flex-col">
            {categories.map(category => (
              <CategoryButton key={category.id} category={category} />
            ))}
          </nav>
        </aside>

        <div className="flex-1">
          <div className="lg:hidden bg-white border-b border-gray-200 p-4">
            <Button
              variant="outline"
              onClick={() => setMobileMenuOpen(true)}
              className="w-full justify-start"
            >
              <Menu className="w-4 h-4 mr-2" />
              Filter by Category
            </Button>
          </div>

          {mobileMenuOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
              <div className="fixed left-0 top-0 bottom-0 w-64 bg-white shadow-xl">
                <div className="flex items-center justify-between p-4 border-b">
                  <h2 className="text-lg font-semibold">Categories</h2>
                  <button onClick={() => setMobileMenuOpen(false)}>
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <nav className="flex flex-col">
                  {categories.map(category => (
                    <CategoryButton key={category.id} category={category} />
                  ))}
                </nav>
              </div>
            </div>
          )}

          <div className="px-6 py-8">
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Categories / {getCategoryTitle()}
              </p>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{getCategoryTitle()}</h1>
              <p className="text-xl text-gray-600">Location Library</p>
            </div>

            <div className="bg-[#4a4a4a] text-white py-3 px-6 rounded-t-lg mb-0">
              <h2 className="text-lg font-semibold">{getSectionTitle()}</h2>
            </div>

            <div className="bg-white p-6">
              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="bg-gray-100 rounded-lg overflow-hidden animate-pulse">
                      <div className="aspect-[4/3] bg-gray-200" />
                      <div className="p-4 space-y-3">
                        <div className="h-5 bg-gray-200 rounded w-3/4" />
                        <div className="h-4 bg-gray-200 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activeCategory === 'top-categories' ? (
                <div className="space-y-12">
                  {['Modern', 'Luxury', 'Historical', 'Natural'].map((cat) => {
                    const catProperties = properties.filter(p =>
                      p.categories.includes(cat)
                    ).slice(0, 8);

                    if (catProperties.length === 0) return null;

                    return (
                      <div key={cat}>
                        <h3 className="text-2xl font-bold text-gray-900 mb-6">
                          {cat} Architecture
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                          {catProperties.map(property => (
                            <PropertyCard key={property.id} property={property} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {properties.map(property => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
