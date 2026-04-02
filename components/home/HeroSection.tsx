'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/AuthProvider';

interface HeroSectionProps {
  videoUrl: string;
  posterUrl: string;
  title: string;
  subtitle: string;
}

export function HeroSection({ videoUrl, posterUrl, title, subtitle }: HeroSectionProps) {
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();
  const { userType } = useAuth();

  useEffect(() => {
    if (!videoUrl || !videoRef.current) return;

    const video = videoRef.current;

    const handleCanPlay = () => {
      video.currentTime = 0;
      video.play().then(() => {
        setVideoReady(true);
      }).catch(() => {
        // Autoplay blocked — dismiss loader anyway
        setVideoReady(true);
      });
    };

    video.addEventListener('canplay', handleCanPlay, { once: true });
    video.load();

    // Safety timeout — don't keep loader forever if video is slow
    const timeout = setTimeout(() => {
      setVideoReady(true);
    }, 8000);

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      clearTimeout(timeout);
    };
  }, [videoUrl]);

  return (
    <>
      {/* Full-page loader until video is ready */}
      {!videoReady && (
        <div className="fixed inset-0 z-[200] bg-gray-900 flex items-center justify-center">
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
      )}

      <section className={`relative min-h-screen h-screen flex items-center justify-center overflow-hidden bg-gray-900 ${videoReady ? 'animate-fadeIn' : ''}`}>
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
            style={{ objectFit: 'cover' }}
            onError={() => {
              console.error('Video failed to load:', videoUrl);
              setVideoReady(true);
            }}
          >
            Your browser does not support the video tag.
          </video>
        )}
        {!videoUrl && (
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

        </div>
      </section>
    </>
  );
}
