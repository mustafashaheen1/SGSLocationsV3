'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ProductionLogo {
  id: string;
  name: string;
  logo_url: string;
  logo_type: string;
  display_order: number;
}

interface ProductionLogosProps {
  logos: ProductionLogo[];
}

export function ProductionLogos({ logos }: ProductionLogosProps) {
  if (logos.length === 0) return null;

  return (
    <section className="py-24 bg-white">
      <div className="mx-auto px-4" style={{maxWidth: '1345px'}}>
        <h2 className="text-4xl text-center mb-4" style={{fontWeight: 100, color: '#212529'}}>Featured in Major Productions</h2>
        <p className="text-center mb-8 text-lg" style={{fontWeight: 300, color: '#6c757d'}}>
          Trusted by leading production companies and streaming platforms
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center">
          {logos.map((item) => (
            <LogoImage key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

function LogoImage({ item }: { item: ProductionLogo }) {
  const [error, setError] = useState(false);

  return (
    <div className="flex items-center justify-center h-64 w-full">
      {error ? (
        <div className="flex items-center justify-center h-48 w-[480px] bg-gray-100 rounded text-gray-500 text-sm">
          {item.name}
        </div>
      ) : (
        <img
          src={item.logo_url}
          alt={item.name}
          className="max-h-48 max-w-[480px] w-auto object-contain transition-all duration-300"
          onError={() => setError(true)}
        />
      )}
    </div>
  );
}
