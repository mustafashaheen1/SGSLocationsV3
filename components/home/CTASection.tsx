'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Camera, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/AuthProvider';

export function CTASection() {
  const router = useRouter();
  const { userType } = useAuth();

  return (
    <section className="grid md:grid-cols-2">
      <div className="relative min-h-[300px] md:min-h-[400px] flex items-center justify-center p-12">
        <Image
          src="https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?w=1200&q=80"
          alt="Production professionals"
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          loading="lazy"
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
          sizes="(max-width: 768px) 100vw, 50vw"
          loading="lazy"
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
  );
}
