'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function PortfolioPage() {
  const portfolioItems = [
    { id: 1, image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200', title: 'Feature Film - Kawasaki', aspectRatio: 1.33 },
    { id: 2, image: 'https://images.unsplash.com/photo-1574267432644-f71eeee8ac02?w=1200', title: 'Suits LA - NBC - Modern 310', aspectRatio: 2.0 },
    { id: 3, image: 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=1200', title: 'Harper\'s Bazaar Magazine', aspectRatio: 1.6 },
    { id: 4, image: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=1200', title: 'Vanity Fair - Selena Gomez', aspectRatio: 1.0 },
    { id: 5, image: 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=1200', title: 'Vogue Kitchen Editorial', aspectRatio: 2.3 },
    { id: 6, image: 'https://images.unsplash.com/photo-1522093537031-3ee69e6b1746?w=1200', title: 'On Call - Prime Series', aspectRatio: 1.1 },
    { id: 7, image: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=1200', title: 'McDonald\'s Commercial', aspectRatio: 1.8 },
    { id: 8, image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200', title: 'Elle Magazine', aspectRatio: 1.2 },
    { id: 9, image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200', title: 'W Magazine - Beyoncé', aspectRatio: 1.5 },
    { id: 10, image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1200', title: 'Gucci Campaign', aspectRatio: 1.7 },
    { id: 11, image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200', title: 'Living Proof - Modern Estate', aspectRatio: 2.2 },
    { id: 12, image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200', title: 'People Magazine', aspectRatio: 0.9 },
    { id: 13, image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200', title: 'Town & Country', aspectRatio: 1.4 },
    { id: 14, image: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1200', title: 'The Cut Magazine', aspectRatio: 1.0 },
    { id: 15, image: 'https://images.unsplash.com/photo-1487017159836-4e23ece2e4cf?w=1200', title: 'Billboard No.1s', aspectRatio: 2.5 },
    { id: 16, image: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200', title: 'The Golden Bachelor', aspectRatio: 1.3 },
    { id: 17, image: 'https://images.unsplash.com/photo-1542744095-291d1f67b221?w=1200', title: 'Vanity Fair Photoshoot', aspectRatio: 1.8 },
    { id: 18, image: 'https://images.unsplash.com/photo-1460518451285-97b6aa326961?w=1200', title: 'Architectural Digest', aspectRatio: 1.1 },
    { id: 19, image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1200', title: 'Film Noir Production', aspectRatio: 2.1 },
    { id: 20, image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200', title: 'Studio Recording Session', aspectRatio: 1.6 },
    { id: 21, image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=1200', title: 'Live Performance', aspectRatio: 1.4 },
    { id: 22, image: 'https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?w=1200', title: 'Cinema Production', aspectRatio: 2.0 },
    { id: 23, image: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1200', title: 'Indie Film', aspectRatio: 1.2 },
    { id: 24, image: 'https://images.unsplash.com/photo-1518929458119-e5bf444c30f4?w=1200', title: 'TV Commercial', aspectRatio: 1.5 },
    { id: 25, image: 'https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?w=1200', title: 'Brand Campaign', aspectRatio: 2.3 },
    { id: 26, image: 'https://images.unsplash.com/photo-1512070679279-8988d32161be?w=1200', title: 'Theater Production', aspectRatio: 1.0 },
    { id: 27, image: 'https://images.unsplash.com/photo-1560169897-fc0cdbdfa4d5?w=1200', title: 'Streaming Series', aspectRatio: 1.7 },
    { id: 28, image: 'https://images.unsplash.com/photo-1594908900066-3f47337549d8?w=1200', title: 'Behind The Scenes', aspectRatio: 1.9 },
    { id: 29, image: 'https://images.unsplash.com/photo-1564177416131-aa37b0be4804?w=1200', title: 'Production Stills', aspectRatio: 1.1 },
    { id: 30, image: 'https://images.unsplash.com/photo-1595769816263-9b910be24d5f?w=1200', title: 'Editorial Campaign', aspectRatio: 2.4 },
  ];

  return (
    <>
      <style jsx global>{`
        .portfolio-grid {
          width: 100%;
          overflow: hidden;
          margin: 0;
          padding: 0;
        }

        .portfolio-item {
          float: left;
          margin: 3px;
          position: relative;
          overflow: hidden;
        }

        @media (max-width: 768px) {
          .portfolio-item {
            height: 250px !important;
            width: calc(50% - 6px) !important;
          }
        }

        @media (max-width: 480px) {
          .portfolio-item {
            height: 200px !important;
            width: 100% !important;
            margin: 3px 0 !important;
          }
        }
      `}</style>

      <main className="min-h-screen bg-white" style={{ paddingTop: '110px' }}>
        {/* Heading */}
        <div style={{ paddingLeft: '1rem', paddingTop: '2rem', paddingBottom: '2rem' }}>
          <h1 className="text-4xl font-light text-gray-900">
            Recent Projects
          </h1>
        </div>

        {/* Portfolio Grid - FULL WIDTH */}
        <div className="portfolio-grid">
          {portfolioItems.map((item) => (
            <div
              key={item.id}
              className="portfolio-item group cursor-pointer"
              style={{
                height: '400px',
                width: `${item.aspectRatio * 400}px`
              }}
            >
              {/* Image */}
              <Image
                src={item.image}
                alt={item.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 33vw"
              />

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100">
                <h3 className="text-white text-xl font-light mb-4 px-4 text-center">
                  {item.title}
                </h3>
                <button className="bg-[#e11921] text-white px-6 py-2 font-medium text-sm hover:bg-[#c01419] transition-colors">
                  Visit Location
                </button>
              </div>
            </div>
          ))}

          {/* Clearfix */}
          <div style={{ clear: 'both' }} />
        </div>
      </main>
    </>
  );
}
