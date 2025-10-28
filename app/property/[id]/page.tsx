'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MapPin, Home, Ruler, Car, Calendar, Check, Share2, Heart } from 'lucide-react';
import { supabase, Property } from '@/lib/supabase';

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProperty() {
      const { data } = await supabase
        .from('properties')
        .select('*')
        .eq('id', params.id)
        .maybeSingle();

      if (data) {
        setProperty(data);
      }
      setLoading(false);
    }
    fetchProperty();
  }, [params.id]);

  if (loading) {
    return <div className="min-h-screen bg-white pt-[110px] flex items-center justify-center">Loading...</div>;
  }

  if (!property) {
    return <div className="min-h-screen bg-white pt-[110px] flex items-center justify-center">Property not found</div>;
  }

  const images = property.images.length > 0 ? property.images : [property.primary_image || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80'];

  return (
    <main className="min-h-screen bg-white pt-[110px]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="mb-4">
              <div className="aspect-[16/10] relative rounded-lg overflow-hidden mb-4">
                <Image
                  src={images[selectedImage]}
                  alt={property.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {images.slice(0, 4).map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-[4/3] relative rounded overflow-hidden ${
                      selectedImage === index ? 'ring-2 ring-[#dc2626]' : ''
                    }`}
                  >
                    <Image src={img} alt={`View ${index + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg border p-6 mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{property.name}</h1>
              <p className="text-gray-600 flex items-center gap-2 mb-6">
                <MapPin className="w-5 h-5" />
                {property.address}, {property.city}, TX {property.zipcode}
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 pb-6 border-b">
                {property.square_footage && (
                  <div className="flex items-center gap-3">
                    <Ruler className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Size</div>
                      <div className="font-semibold">{property.square_footage.toLocaleString()} sqft</div>
                    </div>
                  </div>
                )}
                {property.bedrooms && (
                  <div className="flex items-center gap-3">
                    <Home className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Bedrooms</div>
                      <div className="font-semibold">{property.bedrooms}</div>
                    </div>
                  </div>
                )}
                {property.bathrooms && (
                  <div className="flex items-center gap-3">
                    <Home className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Bathrooms</div>
                      <div className="font-semibold">{property.bathrooms}</div>
                    </div>
                  </div>
                )}
                {property.parking_spaces && (
                  <div className="flex items-center gap-3">
                    <Car className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Parking</div>
                      <div className="font-semibold">{property.parking_spaces} spaces</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-bold mb-3">Description</h2>
                <p className="text-gray-700 leading-relaxed">{property.description}</p>
              </div>

              {property.features.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-xl font-bold mb-3">Features & Amenities</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {property.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-[#dc2626]" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {property.permits_available && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-1">Film Permits Available</h3>
                  <p className="text-sm text-green-700">{property.permit_details || 'This property has filming permits available.'}</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border p-6 sticky top-24">
              <div className="text-3xl font-bold text-[#dc2626] mb-6">
                ${property.daily_rate}/day
              </div>

              <Button
                onClick={() => router.push('/login')}
                size="lg"
                className="w-full bg-[#dc2626] hover:bg-[#b91c1c] mb-3"
              >
                <Calendar className="w-5 h-5 mr-2" />
                Request Booking
              </Button>

              <div className="flex gap-2 mb-6">
                <Button variant="outline" size="sm" className="flex-1">
                  <Heart className="w-4 h-4 mr-1" />
                  Save
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Share2 className="w-4 h-4 mr-1" />
                  Share
                </Button>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-bold mb-4">Property Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Property Type</span>
                    <span className="font-medium">{property.property_type}</span>
                  </div>
                  {property.year_built && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Year Built</span>
                      <span className="font-medium">{property.year_built}</span>
                    </div>
                  )}
                  {property.lot_size && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Lot Size</span>
                      <span className="font-medium">{property.lot_size} acres</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">County</span>
                    <span className="font-medium">{property.county || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
