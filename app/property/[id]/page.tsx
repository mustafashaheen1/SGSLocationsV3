'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Mail,
  Image as ImageIcon,
  Download,
  FileText,
  Search,
  Phone
} from 'lucide-react';
import { supabase, Property } from '@/lib/supabase';

export default function PropertyDetailPage() {
  const params = useParams();
  const [property, setProperty] = useState<Property | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [similarProperties, setSimilarProperties] = useState<Property[]>([]);
  const [nearbyProperties, setNearbyProperties] = useState<Property[]>([]);

  useEffect(() => {
    async function fetchData() {
      const { data: propertyData } = await supabase
        .from('properties')
        .select('*')
        .eq('id', params.id)
        .maybeSingle();

      if (propertyData) {
        setProperty(propertyData);

        const { data: similarData } = await supabase
          .from('properties')
          .select('*')
          .neq('id', propertyData.id)
          .limit(4);

        const { data: nearbyData } = await supabase
          .from('properties')
          .select('*')
          .neq('id', propertyData.id)
          .limit(4);

        setSimilarProperties(similarData || []);
        setNearbyProperties(nearbyData || []);
      }
      setLoading(false);
    }
    fetchData();
  }, [params.id]);

  const nextImage = () => {
    if (property && property.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
    }
  };

  const prevImage = () => {
    if (property && property.images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white pt-[110px] flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-white pt-[110px] flex items-center justify-center">
        <div className="text-xl text-gray-600">Property not found</div>
      </div>
    );
  }

  const images = property.images.length > 0 ? property.images : [property.primary_image || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80'];
  const features = property.features || [];
  const categoryTags = ['Pool', 'Jacuzzi', 'Hot Tub', 'Patio', 'Kitchen', 'Garden', 'Staircase', 'Gazebo', 'Living Room', 'Bathroom', 'Dining Room'];

  return (
    <>
      <style jsx global>{`
        @import url('https://use.typekit.net/jhk6rqb.css');

        body {
          font-family: acumin-pro-wide, sans-serif;
          font-weight: 300;
        }

        h1, h2, h3 {
          font-family: acumin-pro-wide, sans-serif;
        }
      `}</style>

      <main className="min-h-screen bg-white" style={{ paddingTop: '110px' }}>
        {/* Hero Image Gallery - FULL WIDTH */}
        <div className="relative bg-black" style={{ height: '600px' }}>
          <Image
            src={images[currentImageIndex]}
            alt={property.name}
            fill
            style={{ objectFit: 'contain' }}
            priority
            unoptimized
          />

          {/* Navigation Arrows */}
          <button
            onClick={prevImage}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/80 hover:bg-white rounded-full flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-900" />
          </button>

          <button
            onClick={nextImage}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/80 hover:bg-white rounded-full flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-6 h-6 text-gray-900" />
          </button>

          {/* Image Counter */}
          <div className="absolute bottom-4 right-4 bg-black/70 text-white px-4 py-2 rounded text-sm">
            {currentImageIndex + 1} / {images.length}
          </div>
        </div>

        {/* Category Tags Bar */}
        <div className="bg-white border-b border-gray-200">
          <div className="overflow-x-auto">
            <div className="flex gap-8 px-8 py-4 min-w-max">
              {categoryTags.map((tag) => (
                <button
                  key={tag}
                  className="text-gray-500 hover:text-gray-900 transition-colors whitespace-nowrap text-sm font-light"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Property Details Section */}
        <div className="max-w-[1200px] mx-auto px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LEFT SIDE - Property Info */}
            <div className="lg:col-span-2">
              <h1 className="text-5xl font-light text-gray-900 mb-2" style={{ fontWeight: 300 }}>
                {property.name}
              </h1>

              <p className="text-2xl font-light text-gray-500 mb-6" style={{ fontWeight: 300 }}>
                {property.city}
              </p>

              {/* Badges */}
              <div className="flex gap-3 mb-6">
                <span className="inline-block bg-blue-500 text-white px-4 py-1 rounded-full text-sm">
                  Film
                </span>
                {property.permits_available && (
                  <span className="inline-block bg-[#e11921] text-white px-4 py-1 rounded-full text-sm">
                    Pull My Permit
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-gray-700 leading-relaxed mb-8 font-light">
                {property.description || 'This stunning property offers exceptional filming opportunities with versatile spaces and professional-grade amenities. Perfect for productions of all sizes.'}
              </p>

              {/* Inquire Button */}
              <button className="bg-[#e11921] hover:bg-[#bf151c] text-white px-8 py-3 rounded text-sm font-normal uppercase tracking-wider transition-colors">
                Inquire About {property.name}
              </button>
            </div>

            {/* RIGHT SIDE - Action Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={copyLink}
                className="flex items-center justify-center gap-2 bg-white border-2 border-[#e11921] text-[#e11921] hover:bg-[#e11921] hover:text-white px-6 py-3 rounded text-sm font-normal uppercase tracking-wider transition-colors"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>

              <button className="flex items-center justify-center gap-2 bg-[#e11921] hover:bg-[#bf151c] text-white px-6 py-3 rounded text-sm font-normal uppercase tracking-wider transition-colors">
                <Mail className="w-4 h-4" />
                Contact Us
              </button>

              <button
                onClick={() => setShowThumbnails(!showThumbnails)}
                className="flex items-center justify-center gap-2 bg-[#e11921] hover:bg-[#bf151c] text-white px-6 py-3 rounded text-sm font-normal uppercase tracking-wider transition-colors"
              >
                <ImageIcon className="w-4 h-4" />
                Thumbnails
              </button>

              <button className="flex items-center justify-center gap-2 bg-[#e11921] hover:bg-[#bf151c] text-white px-6 py-3 rounded text-sm font-normal uppercase tracking-wider transition-colors">
                <Download className="w-4 h-4" />
                Download Images
              </button>

              <button className="flex items-center justify-center gap-2 bg-[#e11921] hover:bg-[#bf151c] text-white px-6 py-3 rounded text-sm font-normal uppercase tracking-wider transition-colors">
                <FileText className="w-4 h-4" />
                Location PDF
              </button>
            </div>
          </div>
        </div>

        {/* Thumbnails Grid Modal */}
        {showThumbnails && (
          <div className="fixed inset-0 bg-black/90 z-50 overflow-auto">
            <div className="max-w-[1400px] mx-auto px-8 py-12">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-light text-white">All Images</h2>
                <button
                  onClick={() => setShowThumbnails(false)}
                  className="text-white text-4xl hover:text-gray-300"
                >
                  ×
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentImageIndex(index);
                      setShowThumbnails(false);
                    }}
                    className="aspect-[4/3] relative overflow-hidden rounded hover:opacity-80 transition-opacity"
                  >
                    <Image
                      src={img}
                      alt={`Image ${index + 1}`}
                      fill
                      style={{ objectFit: 'cover' }}
                      unoptimized
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Similar Locations Section */}
        {similarProperties.length > 0 && (
          <div className="bg-gray-50 py-16">
            <div className="max-w-[1200px] mx-auto px-8">
              <h2 className="text-4xl font-light text-gray-900 mb-8" style={{ fontWeight: 300 }}>
                Similar Locations
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {similarProperties.map((prop) => (
                  <PropertyCard key={prop.id} property={prop} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Nearby Locations Section */}
        {nearbyProperties.length > 0 && (
          <div className="bg-white py-16">
            <div className="max-w-[1200px] mx-auto px-8">
              <h2 className="text-4xl font-light text-gray-900 mb-8" style={{ fontWeight: 300 }}>
                Nearby Locations
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {nearbyProperties.map((prop, index) => (
                  <PropertyCard key={prop.id} property={prop} distance={`.${index + 1}2 miles away`} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-12">
          <div className="max-w-[1200px] mx-auto px-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-12 h-12 bg-[#e11921] rounded-full flex items-center justify-center">
                <div className="text-white text-2xl">🎬</div>
              </div>
              <span className="text-2xl font-light text-gray-900">IMAGE LOCATIONS</span>
            </div>

            <div className="flex items-center justify-center gap-2 mb-4 text-gray-700">
              <Phone className="w-5 h-5" />
              <span className="text-lg">(310) 871-8004</span>
            </div>

            <div className="text-sm text-gray-500 mb-2">
              American Express Preferred Partner
            </div>

            <div className="text-sm text-gray-500 mb-4">
              CalDRE #01234567
            </div>

            <div className="text-xs text-gray-400">
              © {new Date().getFullYear()} Image Locations. All rights reserved.
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}

function PropertyCard({ property, distance }: { property: Property; distance?: string }) {
  return (
    <Link href={`/property/${property.id}`} className="group block">
      <div className="relative aspect-[4/3] overflow-hidden rounded mb-3">
        <Image
          src={property.primary_image || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'}
          alt={property.name}
          fill
          style={{ objectFit: 'cover' }}
          className="transition-transform duration-300 group-hover:scale-105"
          unoptimized
        />

        {distance && (
          <div className="absolute top-3 left-3 bg-white text-gray-900 px-3 py-1 rounded text-xs font-medium">
            {distance}
          </div>
        )}

        <div className="absolute bottom-3 right-3 w-10 h-10 bg-[#e11921] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Search className="w-5 h-5 text-white" />
        </div>
      </div>

      <h3 className="text-lg font-light text-gray-900 mb-1" style={{ fontWeight: 300 }}>
        {property.name}
      </h3>
      <p className="text-sm font-light text-gray-500" style={{ fontWeight: 300 }}>
        {property.city}
      </p>
    </Link>
  );
}
