'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function PortfolioPage() {
  const portfolioItems = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800&q=80',
      title: 'Feature Film Production',
      width: 600,
      height: 400
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&q=80',
      title: 'TV Series',
      width: 500,
      height: 400
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=800&q=80',
      title: 'Commercial Shoot',
      width: 650,
      height: 400
    },
    {
      id: 4,
      image: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&q=80',
      title: 'Music Video',
      width: 550,
      height: 400
    },
    {
      id: 5,
      image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&q=80',
      title: 'Documentary',
      width: 450,
      height: 400
    },
    {
      id: 6,
      image: 'https://images.unsplash.com/photo-1574267432644-f610387c2239?w=800&q=80',
      title: 'Fashion Shoot',
      width: 600,
      height: 400
    },
    {
      id: 7,
      image: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&q=80',
      title: 'Editorial Photography',
      width: 500,
      height: 400
    },
    {
      id: 8,
      image: 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=800&q=80',
      title: 'Corporate Video',
      width: 700,
      height: 400
    },
    {
      id: 9,
      image: 'https://images.unsplash.com/photo-1524712245354-2c4e5e7121c0?w=800&q=80',
      title: 'Magazine Cover',
      width: 480,
      height: 400
    },
    {
      id: 10,
      image: 'https://images.unsplash.com/photo-1460518451285-97b6aa326961?w=800&q=80',
      title: 'Feature Film',
      width: 620,
      height: 400
    },
    {
      id: 11,
      image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80',
      title: 'Film Noir Production',
      width: 550,
      height: 400
    },
    {
      id: 12,
      image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80',
      title: 'Studio Recording',
      width: 600,
      height: 400
    },
    {
      id: 13,
      image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&q=80',
      title: 'Live Performance',
      width: 650,
      height: 400
    },
    {
      id: 14,
      image: 'https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?w=800&q=80',
      title: 'Cinema Production',
      width: 500,
      height: 400
    },
    {
      id: 15,
      image: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&q=80',
      title: 'Indie Film',
      width: 580,
      height: 400
    },
    {
      id: 16,
      image: 'https://images.unsplash.com/photo-1518929458119-e5bf444c30f4?w=800&q=80',
      title: 'TV Commercial',
      width: 520,
      height: 400
    },
    {
      id: 17,
      image: 'https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?w=800&q=80',
      title: 'Brand Campaign',
      width: 600,
      height: 400
    },
    {
      id: 18,
      image: 'https://images.unsplash.com/photo-1512070679279-8988d32161be?w=800&q=80',
      title: 'Theater Production',
      width: 550,
      height: 400
    },
    {
      id: 19,
      image: 'https://images.unsplash.com/photo-1560169897-fc0cdbdfa4d5?w=800&q=80',
      title: 'Streaming Series',
      width: 630,
      height: 400
    },
    {
      id: 20,
      image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&q=80',
      title: 'Award Winning Film',
      width: 500,
      height: 400
    },
    {
      id: 21,
      image: 'https://images.unsplash.com/photo-1594908900066-3f47337549d8?w=800&q=80',
      title: 'Behind The Scenes',
      width: 620,
      height: 400
    },
    {
      id: 22,
      image: 'https://images.unsplash.com/photo-1564177416131-aa37b0be4804?w=800&q=80',
      title: 'Production Stills',
      width: 480,
      height: 400
    },
    {
      id: 23,
      image: 'https://images.unsplash.com/photo-1595769816263-9b910be24d5f?w=800&q=80',
      title: 'Editorial Campaign',
      width: 600,
      height: 400
    },
    {
      id: 24,
      image: 'https://images.unsplash.com/photo-1524712245354-2c4e5e7121c0?w=800&q=80',
      title: 'Print Campaign',
      width: 500,
      height: 400
    },
  ];

  return (
    <>
      <style jsx global>{`
        .portfolio-grid {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-start;
          overflow: hidden;
        }

        .portfolio-item {
          float: left;
          margin: 3px;
          box-sizing: content-box;
          overflow: hidden;
          position: relative;
          height: 400px;
        }

        .portfolio-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        @media (max-width: 768px) {
          .portfolio-item {
            height: 250px;
          }
        }

        @media (max-width: 480px) {
          .portfolio-item {
            height: 200px;
            width: 100% !important;
          }
        }
      `}</style>

      <main className="min-h-screen bg-white" style={{ paddingTop: '110px' }}>
        {/* Page Heading */}
        <div className="px-6 py-8">
          <h1 className="text-4xl font-light text-gray-900">
            Recent Projects
          </h1>
        </div>

        {/* Masonry Grid */}
        <div className="px-3">
          <div className="portfolio-grid">
            {portfolioItems.map((item) => (
              <div
                key={item.id}
                className="portfolio-item group cursor-pointer"
                style={{
                  width: `${(item.width / item.height) * 400}px`,
                  flex: '0 0 auto'
                }}
              >
                <Image
                  src={item.image}
                  alt={item.title}
                  width={item.width}
                  height={item.height}
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  style={{ width: '100%', height: '100%' }}
                />
                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
