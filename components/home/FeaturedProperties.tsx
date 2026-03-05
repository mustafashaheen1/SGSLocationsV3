import Link from 'next/link';
import Image from 'next/image';
import { MapPin } from 'lucide-react';
import { Property } from '@/lib/supabase';

interface FeaturedPropertiesProps {
  properties: Property[];
}

export function FeaturedProperties({ properties }: FeaturedPropertiesProps) {
  if (properties.length === 0) return null;

  return (
    <section className="py-24 bg-white">
      <div className="mx-auto px-4" style={{maxWidth: '1345px'}}>
        <h2 className="text-4xl text-center mb-16" style={{fontWeight: 100, color: '#212529'}}>Featured Locations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {properties.map((property) => (
            <Link
              key={property.id}
              href={`/property/${property.id}`}
              className="group block bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all"
            >
              <div className="aspect-[3/2] relative overflow-hidden">
                <Image
                  src={property.primary_image || property.images?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80'}
                  alt={property.public_name || property.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <h3 className="text-xl mb-1" style={{fontWeight: 300, color: '#212529'}}>{property.public_name || property.name}</h3>
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
  );
}
