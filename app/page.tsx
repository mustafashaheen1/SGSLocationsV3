'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MapPin, Award, Users, Briefcase, FileCheck, Image as ImageIcon, Camera } from 'lucide-react';
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

interface Service {
  id: string;
  icon: string;
  title: string;
  description: string;
  display_order: number;
}

interface ProductionLogo {
  id: string;
  name: string;
  logo_url: string;
  logo_type: string;
  display_order: number;
}

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [heroVideo, setHeroVideo] = useState('');
  const [heroPoster, setHeroPoster] = useState('');
  const [heroTitle, setHeroTitle] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [productionLogos, setProductionLogos] = useState<ProductionLogo[]>([]);
  const [contentLoaded, setContentLoaded] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    // Force load after 10 seconds (increased from 5)
    const forceLoadTimeout = setTimeout(() => {
      if (isMounted && !contentLoaded) {
        console.warn('⚠️ Force loading page after 10 second timeout');
        setContentLoaded(true);
      }
    }, 10000);

    async function fetchData() {
      try {
        console.log('🏠 Starting home page data fetch...');
        // Use directFetch instead of supabase.from()
        const { directFetch } = await import('@/lib/supabase');

        // Fetch hero settings
        console.log('📥 Fetching site settings...');
        const { data: settings, error: settingsError } = await directFetch('site_settings', {
          in: { key: ['hero_video', 'hero_video_poster', 'hero_title', 'hero_subtitle'] }
        });

        if (settingsError) {
          console.error('❌ Error fetching site settings:', settingsError);
        } else {
          console.log('✅ Site settings fetched:', settings?.length || 0, 'items');
        }

        if (isMounted && settings) {
          settings.forEach((setting: any) => {
            if (setting.key === 'hero_video') {
              let videoUrl = setting.value || '';
              console.log('🎥 Hero video URL (raw):', videoUrl);

              // Strip any surrounding quotes that may have been stored
              videoUrl = videoUrl.trim().replace(/^["']|["']$/g, '');
              console.log('🎥 After stripping quotes:', videoUrl);

              // Fix missing protocol (CloudFront URLs often stored without https://)
              if (videoUrl && !videoUrl.startsWith('http') && !videoUrl.startsWith('/')) {
                videoUrl = `https://${videoUrl}`;
                console.log('🎥 Fixed video URL:', videoUrl);
              }

              // Use CloudFront URL directly for instant streaming
              console.log('🎥 Using direct video URL:', videoUrl);
              setHeroVideo(videoUrl);
            }
            if (setting.key === 'hero_video_poster') {
              let posterUrl = setting.value || '';
              // Strip any surrounding quotes
              posterUrl = posterUrl.trim().replace(/^["']|["']$/g, '');
              // Fix missing protocol
              if (posterUrl && !posterUrl.startsWith('http') && !posterUrl.startsWith('/')) {
                posterUrl = `https://${posterUrl}`;
              }
              console.log('🖼️ Hero poster URL:', posterUrl);
              setHeroPoster(posterUrl);
            }
            if (setting.key === 'hero_title') {
              let titleValue = setting.value || '';
              // Strip any surrounding quotes that may have been stored
              titleValue = titleValue.trim().replace(/^["']|["']$/g, '');
              setHeroTitle(titleValue);
            }
            if (setting.key === 'hero_subtitle') {
              let subtitleValue = setting.value || '';
              // Strip any surrounding quotes that may have been stored
              subtitleValue = subtitleValue.trim().replace(/^["']|["']$/g, '');
              setHeroSubtitle(subtitleValue);
            }
          });
        }

        // Fetch services
        console.log('📥 Fetching services...');
        const { data: servicesData, error: servicesError } = await directFetch('services', {
          eq: { is_active: true },
          order: 'display_order',
          ascending: true
        });

        if (servicesError) {
          console.error('❌ Error fetching services:', servicesError);
        } else {
          console.log('✅ Services fetched:', servicesData?.length || 0, 'items');
        }

        if (isMounted && servicesData) {
          setServices(servicesData);
        }

        // Fetch production logos
        console.log('📥 Fetching production logos...');
        const { data: logosData, error: logosError } = await directFetch('production_logos', {
          eq: { is_active: true },
          order: 'display_order',
          ascending: true
        });

        if (logosError) {
          console.error('❌ Error fetching production logos:', logosError);
        } else {
          console.log('✅ Production logos fetched:', logosData?.length || 0, 'items');
        }

        if (isMounted && logosData) {
          setProductionLogos(logosData);
        }

        // Fetch featured properties
        console.log('📥 Fetching featured properties...');
        const { data: featured, error: featuredError } = await directFetch('properties', {
          eq: { status: 'active', is_featured: true },
          order: 'name',
          ascending: true,
          limit: 6
        });

        if (featuredError) {
          console.error('❌ Error fetching featured properties:', featuredError);
        } else {
          console.log('✅ Featured properties fetched:', featured?.length || 0, 'items');
        }

        if (isMounted && featured) {
          setFeaturedProperties(featured);
        }

        // Fetch categories
        console.log('📥 Fetching categories...');
        const { data: categoriesData, error: categoriesError } = await directFetch('categories', {
          eq: { is_active: true },
          order: 'display_order',
          ascending: true
        });

        if (categoriesError) {
          console.error('❌ Error fetching categories:', categoriesError);
        } else {
          console.log('✅ Categories fetched:', categoriesData?.length || 0, 'items');
        }

        if (isMounted && categoriesData) {
          // Filter for subcategories (has parent_id)
          const subcategories = categoriesData.filter((cat: any) => cat.parent_id);
          console.log('📂 Subcategories filtered:', subcategories.length, 'items');
          setCategories(subcategories);
        }

        if (isMounted) {
          console.log('✅ All data fetched successfully - loading page');
          setContentLoaded(true);
        }
      } catch (error) {
        console.error('❌ Error fetching homepage data:', error);
        if (isMounted) {
          console.log('⚠️ Loading page despite errors');
          setContentLoaded(true);
        }
      }
    }

    fetchData();
    checkAuth();

    return () => {
      isMounted = false;
      clearTimeout(forceLoadTimeout);
    };
  }, []);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);

    if (session?.user) {
      const { data: userData } = await (supabase
        .from('users') as any)
        .select('user_type')
        .eq('id', session.user.id)
        .maybeSingle();

      setUserType((userData as any)?.user_type || null);
    } else {
      setUserType(null);
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push('/search');
    }
  };

  // Icon mapping for services
  const iconMap: { [key: string]: any } = {
    'MapPin': MapPin,
    'FileCheck': FileCheck,
    'ImageIcon': ImageIcon,
  };

  // Show full-page loader while content is loading
  if (!contentLoaded) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 mb-4">
            <div className="w-10 h-10 bg-brand rounded flex items-center justify-center">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <span className="text-2xl font-bold text-white">SGS LOCATIONS®</span>
          </div>
          <div className="flex space-x-2 justify-center">
            <div className="w-3 h-3 bg-brand rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-brand rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-brand rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen animate-fadeIn">
      <section className="relative min-h-screen h-screen flex items-center justify-center overflow-hidden">
        {heroVideo ? (
          <video
            key={heroVideo}
            src={heroVideo}
            poster={heroPoster}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectFit: 'cover' }}
            onLoadedData={() => {
              console.log('✅ Video loaded successfully');
            }}
            onError={(e) => {
              console.error('❌ Video failed to load:', heroVideo);
              const videoElement = e.currentTarget as HTMLVideoElement;
              if (videoElement.error) {
                console.error('Video error code:', videoElement.error.code);
                console.error('Video error message:', videoElement.error.message);
              }
              console.error('Video error details:', {
                networkState: videoElement.networkState,
                readyState: videoElement.readyState,
              });
            }}
            onCanPlay={() => {
              console.log('🎬 Video can play');
            }}
          >
            Your browser does not support the video tag.
          </video>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-700" />
        )}
        <div className="absolute inset-0 bg-black/40" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center text-white">
          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl mb-6 tracking-tight" style={{fontWeight: 100}}>
            {heroTitle.split('\n').map((line, i) => (
              <span key={i}>
                {line}
                {i < heroTitle.split('\n').length - 1 && <br />}
              </span>
            ))}
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl mb-12" style={{fontWeight: 300}}>
            {heroSubtitle}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              onClick={() => router.push('/search')}
              size="lg"
              className="bg-brand hover:bg-[#e65a00] text-lg rounded" style={{fontWeight: 300, padding: '0.375rem 0.75rem'}}
            >
              Search Locations
            </Button>
            {userType !== 'producer' && (
              <Button
                onClick={() => router.push('/list-your-property')}
                size="lg"
                variant="outline"
                className="text-lg bg-transparent border-2 border-white text-white hover:bg-white hover:text-gray-900 rounded" style={{fontWeight: 300, padding: '0.375rem 0.75rem'}}
              >
                List Your Property
              </Button>
            )}
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
                className="bg-brand hover:bg-[#e65a00] rounded" style={{fontWeight: 300}}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {featuredProperties.map((property) => (
              <Link
                key={property.id}
                href={`/property/${property.id}`}
                className="group block bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all"
              >
                <div className="aspect-[3/2] relative overflow-hidden">
                  <Image
                    src={property.primary_image || property.images?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80'}
                    alt={property.name}
                    fill
                    unoptimized={(property.primary_image || property.images?.[0] || '').includes('unsplash.com') || (property.primary_image || property.images?.[0] || '').includes('placeholder.com')}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/search?subcategory=${category.id}`}
                className="group relative h-48 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all"
              >
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  priority={true}
                  loading="eager"
                  quality={75}
                  placeholder="empty"
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
              <div key={item.id} className="flex items-center justify-center h-64 w-full">
                <img
                  src={item.logo_url}
                  alt={item.name}
                  className="max-h-48 max-w-[480px] w-auto object-contain transition-all duration-300"
                  onError={(e) => {
                    e.currentTarget.src = `https://via.placeholder.com/480x192/f3f4f6/6b7280?text=${encodeURIComponent(item.name)}`;
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
              const Icon = iconMap[service.icon] || MapPin;
              return (
                <div key={service.id} className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-brand rounded-full mb-6">
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
        <div className="relative min-h-[300px] md:min-h-[400px] flex items-center justify-center p-12">
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
              className="bg-brand hover:bg-[#e65a00] rounded" style={{fontWeight: 300}}
            >
              Start Searching
            </Button>
          </div>
        </div>
        <div className="relative min-h-[300px] md:min-h-[400px] flex items-center justify-center p-12">
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
            {userType !== 'producer' && (
              <Button
                onClick={() => router.push('/list-your-property')}
                size="lg"
                className="bg-white text-gray-900 hover:bg-gray-100 rounded" style={{fontWeight: 300}}
              >
                List Your Property
              </Button>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
