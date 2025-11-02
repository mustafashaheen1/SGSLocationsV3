'use client';

import Image from 'next/image';

export default function PortfolioPage() {
  const portfolioItems = [
    { id: 1, image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800', title: 'Feature Film - Kawasaki', aspectRatio: 1.5 },
    { id: 2, image: 'https://images.unsplash.com/photo-1574267432553-4b4628081c31?w=800', title: 'Suits LA - NBC - Modern 310', aspectRatio: 1.2 },
    { id: 3, image: 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=800', title: 'Harper Bazaar Magazine', aspectRatio: 1.8 },
    { id: 4, image: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=800', title: 'Vanity Fair - Selena Gomez', aspectRatio: 0.7 },
    { id: 5, image: 'https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=800', title: 'Vogue Kitchen Editorial', aspectRatio: 1.6 },
    { id: 6, image: 'https://images.unsplash.com/photo-1522093537031-3ee69e6b1746?w=800', title: 'On Call - Prime Series', aspectRatio: 0.8 },
    { id: 7, image: 'https://images.unsplash.com/photo-1497366672149-e5e4b4d34eb3?w=800', title: 'McDonald Commercial', aspectRatio: 1.3 },
    { id: 8, image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800', title: 'Elle Magazine', aspectRatio: 0.9 },
    { id: 9, image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800', title: 'W Magazine', aspectRatio: 1.4 },
    { id: 10, image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800', title: 'Gucci Campaign', aspectRatio: 1.7 },
    { id: 11, image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800', title: 'Living Proof - Modern Estate', aspectRatio: 1.5 },
    { id: 12, image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800', title: 'People Magazine', aspectRatio: 0.6 },
    { id: 13, image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800', title: 'Town & Country', aspectRatio: 1.3 },
    { id: 14, image: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800', title: 'The Cut Magazine', aspectRatio: 0.8 },
    { id: 15, image: 'https://images.unsplash.com/photo-1487017159836-4e23ece2e4cf?w=800', title: 'Billboard No.1s', aspectRatio: 2.0 },
    { id: 16, image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800', title: 'The Golden Bachelor', aspectRatio: 1.0 },
    { id: 17, image: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=800', title: 'Vanity Fair Photoshoot', aspectRatio: 1.6 },
    { id: 18, image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800', title: 'Architectural Digest', aspectRatio: 0.9 },
    { id: 19, image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800', title: 'Film Noir Production', aspectRatio: 1.7 },
    { id: 20, image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800', title: 'Studio Recording Session', aspectRatio: 1.4 },
    { id: 21, image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800', title: 'Live Performance', aspectRatio: 1.1 },
    { id: 22, image: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800', title: 'Cinema Production', aspectRatio: 1.8 },
    { id: 23, image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800', title: 'Indie Film', aspectRatio: 0.9 },
    { id: 24, image: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800', title: 'TV Commercial', aspectRatio: 1.2 },
    { id: 25, image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800', title: 'Brand Campaign', aspectRatio: 1.9 },
    { id: 26, image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800', title: 'Theater Production', aspectRatio: 0.7 },
    { id: 27, image: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=800', title: 'Streaming Series', aspectRatio: 1.5 },
    { id: 28, image: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800', title: 'Behind The Scenes', aspectRatio: 1.6 },
    { id: 29, image: 'https://images.unsplash.com/photo-1542744173-05336fdb7e66?w=800', title: 'Production Stills', aspectRatio: 0.8 },
    { id: 30, image: 'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=800', title: 'Editorial Campaign', aspectRatio: 2.1 },
  ];

  return (
    <>
      <style jsx global>{`
        @import url('https://use.typekit.net/jhk6rqb.css');

        body {
          font-family: acumin-pro-wide, sans-serif;
          font-weight: 300;
        }

        .portfolio-grid {
          width: 100%;
          margin: 0;
          padding: 0;
          display: flex;
          flex-wrap: wrap;
          gap: 3px;
        }

        .portfolio-item {
          position: relative;
          overflow: hidden;
          background-color: #e9ecef;
          flex-grow: 1;
          height: 250px;
        }

        .portfolio-item img {
          transition: transform 0.3s ease;
        }

        .portfolio-item:hover img {
          transform: scale(1.05);
        }

        @media (max-width: 768px) {
          .portfolio-item {
            height: 250px !important;
            flex-basis: calc(50% - 1.5px) !important;
          }
        }

        @media (max-width: 480px) {
          .portfolio-item {
            height: 200px !important;
            flex-basis: 100% !important;
          }

          .portfolio-grid {
            gap: 3px 0;
          }
        }

        h1 {
          font-family: acumin-pro-wide, sans-serif;
          font-weight: 100;
          letter-spacing: -0.02em;
          margin: 0;
        }

        .overlay-title {
          font-family: acumin-pro-wide, sans-serif;
          font-weight: 300;
        }

        .visit-btn {
          font-family: acumin-pro-wide, sans-serif;
          font-weight: 300;
          letter-spacing: 0.05rem;
          text-transform: uppercase;
        }
      `}</style>

      <main className="min-h-screen bg-white" style={{ paddingTop: '110px' }}>
        {/* Heading - NO PADDING OR MARGIN */}
        <div style={{ paddingLeft: '1rem', paddingTop: '0', paddingBottom: '1rem' }}>
          <h1 style={{ fontSize: '2.5rem', color: '#212529', margin: 0 }}>
            Recent Projects
          </h1>
        </div>

        {/* Portfolio Grid */}
        <div className="portfolio-grid">
          {portfolioItems.map((item) => (
            <div
              key={item.id}
              className="portfolio-item group cursor-pointer"
              style={{
                flexBasis: `${item.aspectRatio * 250}px`
              }}
            >
              <Image
                src={item.image}
                alt={item.title}
                fill
                style={{ objectFit: 'cover' }}
                sizes="(max-width: 768px) 50vw, 25vw"
                unoptimized
              />

              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100">
                <h3 className="overlay-title text-white text-xl mb-4 px-4 text-center">
                  {item.title}
                </h3>
                <button className="visit-btn bg-[#e11921] text-white px-6 py-2 text-sm hover:bg-[#bf151c] transition-colors">
                  VISIT LOCATION
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
