'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MapPin, Award, Users, Briefcase, Camera, FileCheck, Image as ImageIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase, Property } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  count: number;
}

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      // Fetch featured properties
      const { data: featured } = await supabase
        .from('properties')
        .select('*')
        .eq('status', 'active')
        .eq('is_featured', true)
        .limit(6);

      if (featured) setFeaturedProperties(featured);

      // Fetch categories with property counts
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('id, name, slug, image, display_order')
        .eq('is_active', true)
        .order('display_order');

      if (categoriesData) {
        // Get count for each category
        const categoriesWithCounts = await Promise.all(
          categoriesData.map(async (cat) => {
            const { count } = await supabase
              .from('property_categories')
              .select('*', { count: 'exact', head: true })
              .eq('category_id', cat.id);

            return {
              ...cat,
              count: count || 0
            };
          })
        );

        setCategories(categoriesWithCounts);
      }
    }

    fetchData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push('/search');
    }
  };


  const services = [
    {
      icon: MapPin,
      title: 'Location Scouting',
      description: 'Expert location scouting services to find the perfect setting for your production. Access to our extensive database of pre-scouted locations.',
    },
    {
      icon: FileCheck,
      title: 'Permitting Services',
      description: 'Navigate the permitting process with ease. We handle all necessary permits and approvals for filming at your chosen location.',
    },
    {
      icon: ImageIcon,
      title: 'Location Photography',
      description: 'Professional photography services to showcase locations. High-quality images and virtual tours for remote location scouting.',
    },
  ];

  const productionLogos = [
    // TV Shows - Top Row
    {
      name: 'Landman',
      logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/85/Landman_%28TV_series%29_Title_Card.jpg/250px-Landman_%28TV_series%29_Title_Card.jpg',
      fallback: 'https://via.placeholder.com/200x80/f3f4f6/6b7280?text=Landman'
    },
    {
      name: 'Yellowstone',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Yellowstone_%28American_TV_series%29_Title_Card.png/250px-Yellowstone_%28American_TV_series%29_Title_Card.png',
      fallback: 'https://via.placeholder.com/200x80/f3f4f6/6b7280?text=Yellowstone'
    },
    {
      name: 'Madison',
      logo: 'https://via.placeholder.com/200x80/f3f4f6/6b7280?text=Madison',
      fallback: 'https://via.placeholder.com/200x80/f3f4f6/6b7280?text=Madison'
    },
    {
      name: 'Lioness',
      logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/65/Special_Ops-_Lioness_Title_Card.jpg/250px-Special_Ops-_Lioness_Title_Card.jpg',
      fallback: 'https://via.placeholder.com/200x80/f3f4f6/6b7280?text=Lioness'
    },
    // Production Companies - Bottom Row
    {
      name: 'Paramount',
      logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCAyMDAgODAiPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM2YjcyODAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiPnBhcmFtb3VudDwvdGV4dD48L3N2Zz4=',
      fallback: 'https://via.placeholder.com/200x80/f3f4f6/6b7280?text=Paramount'
    },
    {
      name: 'Netflix',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Netflix_2015_logo.svg/320px-Netflix_2015_logo.svg.png'
    },
    {
      name: 'HBO',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/HBO_logo.svg/320px-HBO_logo.svg.png'
    },
    {
      name: 'Amazon Studios',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Prime_Video.png/320px-Prime_Video.png'
    }
  ];

  return (
    <main className="min-h-screen">
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="https://imagelocations.com/video/versace-evo-short.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/40" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center text-white">
          <h1 className="text-6xl md:text-7xl mb-6 tracking-tight" style={{fontWeight: 100}}>
            Dallas Fort Worth's Largest<br />Location Database
          </h1>
          <p className="text-2xl md:text-3xl mb-12" style={{fontWeight: 300}}>
            65+ filming locations across North and Central Texas
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              onClick={() => router.push('/search')}
              size="lg"
              className="bg-[#e11921] hover:bg-[#bf151c] text-lg rounded" style={{fontWeight: 300, padding: '0.375rem 0.75rem'}}
            >
              Search Locations
            </Button>
            <Button
              onClick={() => router.push('/list-your-property')}
              size="lg"
              variant="outline"
              className="text-lg bg-transparent border-2 border-white text-white hover:bg-white hover:text-gray-900 rounded" style={{fontWeight: 300, padding: '0.375rem 0.75rem'}}
            >
              List Your Property
            </Button>
          </div>

          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="flex gap-3 bg-white rounded-lg p-2">
              <Input
                type="text"
                placeholder="Search by location, property type, or features..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 border-0 text-gray-900 text-lg"
              />
              <Button
                type="submit"
                size="lg"
                className="bg-[#e11921] hover:bg-[#bf151c] rounded" style={{fontWeight: 300}}
              >
                <Search className="w-5 h-5 mr-2" />
                Search
              </Button>
            </div>
          </form>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="mx-auto px-4" style={{maxWidth: '1345px'}}>
          <h2 className="text-4xl text-center mb-16" style={{fontWeight: 100, color: '#212529'}}>Featured Locations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProperties.map((property) => (
              <Link
                key={property.id}
                href={`/property/${property.id}`}
                className="group block bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all"
              >
                <div className="aspect-[3/2] relative overflow-hidden">
                  <Image
                    src={property.primary_image || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80'}
                    alt={property.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-xl mb-1" style={{fontWeight: 300, color: '#212529'}}>{property.name}</h3>
                  <p className="text-sm flex items-center gap-1" style={{fontWeight: 300, color: '#6c757d'}}>
                    <MapPin className="w-4 h-4" />
                    {property.city}, Texas
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-[#f8f9fa]">
        <div className="mx-auto px-4" style={{maxWidth: '1345px'}}>
          <h2 className="text-4xl text-center mb-16" style={{fontWeight: 100, color: '#212529'}}>
            Browse by Category
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/search?category=${category.slug}`}
                className="group relative h-48 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all"
              >
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20" />
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h3 className="text-lg mb-1" style={{fontWeight: 400}}>{category.name}</h3>
                  <p className="text-sm opacity-90" style={{fontWeight: 300}}>
                    {category.count} {category.count === 1 ? 'Location' : 'Locations'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="mx-auto px-4" style={{maxWidth: '1345px'}}>
          <h2 className="text-4xl text-center mb-4" style={{fontWeight: 100, color: '#212529'}}>Featured in Major Productions</h2>
          <p className="text-center mb-8 text-lg" style={{fontWeight: 300, color: '#6c757d'}}>
            Trusted by leading production companies and streaming platforms
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center">
            {productionLogos.map((item) => (
              <div key={item.name} className="flex items-center justify-center h-20 w-full">
                <img
                  src={item.logo}
                  alt={item.name}
                  className="max-h-16 max-w-[180px] w-auto object-contain filter grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                  onError={(e) => {
                    if (item.fallback) {
                      e.currentTarget.src = item.fallback;
                    }
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-[#1a3a5a] text-white">
        <div className="mx-auto px-4" style={{maxWidth: '1345px'}}>
          <h2 className="text-4xl text-center mb-16" style={{fontWeight: 100}}>Our Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <div key={service.title} className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-[#e11921] rounded-full mb-6">
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl mb-4" style={{fontWeight: 300}}>{service.title}</h3>
                  <p className="text-gray-300 leading-relaxed" style={{fontWeight: 300}}>{service.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid md:grid-cols-2">
        <div className="relative min-h-[400px] flex items-center justify-center p-12">
          <Image
            src="https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?w=1200&q=80"
            alt="Production professionals"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative z-10 text-center text-white">
            <Camera className="w-16 h-16 mx-auto mb-6" />
            <h3 className="text-3xl mb-4" style={{fontWeight: 100}}>For Production Professionals</h3>
            <p className="mb-6 text-lg" style={{fontWeight: 300}}>
              Find the perfect location for your next project
            </p>
            <Button
              onClick={() => router.push('/search')}
              size="lg"
              className="bg-[#e11921] hover:bg-[#bf151c] rounded" style={{fontWeight: 300}}
            >
              Start Searching
            </Button>
          </div>
        </div>
        <div className="relative min-h-[400px] flex items-center justify-center p-12">
          <Image
            src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80"
            alt="Property owners"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative z-10 text-center text-white">
            <Briefcase className="w-16 h-16 mx-auto mb-6" />
            <h3 className="text-3xl mb-4" style={{fontWeight: 100}}>For Property Owners</h3>
            <p className="mb-6 text-lg" style={{fontWeight: 300}}>
              Turn your property into a filming location
            </p>
            <Button
              onClick={() => router.push('/list-your-property')}
              size="lg"
              className="bg-white text-gray-900 hover:bg-gray-100 rounded" style={{fontWeight: 300}}
            >
              List Your Property
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
