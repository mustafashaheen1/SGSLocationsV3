'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/components/AuthProvider';
import Image from 'next/image';

interface HeroSectionProps {
  videoUrl: string;
  posterUrl: string;
  title: string;
  subtitle: string;
}

export function HeroSection({ videoUrl, posterUrl, title, subtitle }: HeroSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [videoReadyToPlay, setVideoReadyToPlay] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();
  const { userType } = useAuth();

  useEffect(() => {
    if (!videoUrl || !videoRef.current) return;

    const video = videoRef.current;

    const handleCanPlay = () => {
      // Reset to frame 0 so video starts from the beginning when visible
      video.currentTime = 0;
      video.play().then(() => {
        setVideoReadyToPlay(true);
      }).catch(() => {
        // Autoplay may be blocked — poster stays visible
      });
    };

    video.addEventListener('canplay', handleCanPlay, { once: true });
    // Start downloading the video now (preload="none" prevents automatic buffering)
    video.load();

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [videoUrl]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push('/search');
    }
  };

  return (
    <section className="relative min-h-screen h-screen flex items-center justify-center overflow-hidden bg-gray-900">
      {/* Poster always rendered underneath — video covers it when playing */}
      {posterUrl && (
        <Image
          src={posterUrl}
          alt=""
          fill
          priority
          className="absolute inset-0 object-cover"
          sizes="100vw"
        />
      )}
      {videoUrl && (
        <video
          ref={videoRef}
          key={videoUrl}
          src={videoUrl}
          loop
          muted
          playsInline
          preload="none"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectFit: 'cover', opacity: videoReadyToPlay ? 1 : 0, transition: 'opacity 0.5s ease' }}
          onError={() => {
            console.error('Video failed to load:', videoUrl);
          }}
        >
          Your browser does not support the video tag.
        </video>
      )}
      {!videoUrl && !posterUrl && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-700" />
      )}
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center text-white">
        <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl mb-6 tracking-tight" style={{fontWeight: 100}}>
          {title.split('\n').map((line, i) => (
            <span key={i}>
              {line}
              {i < title.split('\n').length - 1 && <br />}
            </span>
          ))}
        </h1>
        <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl mb-12" style={{fontWeight: 300}}>
          {subtitle}
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
  );
}
