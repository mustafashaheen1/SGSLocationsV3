'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Camera } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Dynamic Section Renderer Component
function DynamicSection({ section, index }: { section: any; index: number }) {
  if (!section?.title && !section?.content) return null;

  // Determine layout: alternating between media-left and media-right
  const isMediaLeft = index % 2 === 0;
  const isTextOnly = section.mediaType === 'none' || (!section.image && !section.videoUrl);

  const MediaColumn = () => {
    if (isTextOnly) return null;

    return (
      <div className={`d-flex col-md-6 justify-content-center align-items-center border ${!isMediaLeft ? 'm-order-0' : ''}`}>
        {section.image ? (
          <Image
            src={section.image}
            alt={section.title || `Section ${index + 1}`}
            width={800}
            height={600}
            className="w-100 h-auto"
          />
        ) : section.videoUrl ? (
          <div className="w-100" style={{ padding: '56.25% 0 0 0', position: 'relative' }}>
            <video
              src={section.videoUrl}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
              controls
            />
          </div>
        ) : null}
      </div>
    );
  };

  const ContentColumn = () => (
    <div className={`col-md-6 ${isTextOnly ? 'offset-md-3 text-center' : ''} py-5 px-md-5 d-flex justify-content-center align-items-center flex-column ${!isMediaLeft && !isTextOnly ? 'm-order-1' : ''}`}>
      <div className="w-100">
        {section.title && (
          <h3 className="h3 text-2xl font-semibold text-gray-900 mb-4">
            {section.title}
          </h3>
        )}
        {section.content && (
          <p className="mb-4 text-gray-700" style={{ whiteSpace: 'pre-wrap' }}>
            {section.content}
          </p>
        )}
        {section.linkText && section.linkUrl && (
          <Link
            href={section.linkUrl}
            className="text-[#dc2626] hover:underline font-medium"
            target={section.linkUrl.startsWith('http') ? '_blank' : undefined}
            rel={section.linkUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
          >
            {section.linkText}
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <section className="row">
      {isMediaLeft ? (
        <>
          <MediaColumn />
          <ContentColumn />
        </>
      ) : (
        <>
          <ContentColumn />
          <MediaColumn />
        </>
      )}
    </section>
  );
}

export default function AboutPage() {
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchContent() {
      const { data } = await supabase
        .from('about_page_content')
        .select('*')
        .order('section, display_order');

      if (data && data.length > 0) {
        // Find the maximum section number dynamically
        const maxSection = Math.max(
          ...data.map((item: any) => {
            const match = item.section.match(/section_(\d+)/);
            return match ? parseInt(match[1]) : 0;
          })
        );

        const sectionData = [];
        for (let i = 1; i <= maxSection; i++) {
          const section: any = {};
          const sectionContent = (data as any[]).filter((item: any) => item.section === `section_${i}`);

          sectionContent.forEach(item => {
            let value = item.value;
            if (typeof value === 'string' && value.startsWith('"')) {
              try {
                value = JSON.parse(value);
              } catch (e) {
                // Use as is if parse fails
              }
            }
            section[item.key] = value;
          });

          sectionData.push(section);
        }
        setSections(sectionData);
      }
      setLoading(false);
    }

    fetchContent();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </main>
    );
  }

  return (
    <>
      <style jsx global>{`
        /* Mobile responsive improvements for About page */
        .container {
          padding-left: 1rem;
          padding-right: 1rem;
        }

        @media (min-width: 768px) {
          .container {
            padding-left: 15px;
            padding-right: 15px;
          }
        }

        /* Bootstrap grid mobile stacking */
        .row {
          display: flex;
          flex-wrap: wrap;
          margin-left: -15px;
          margin-right: -15px;
        }

        .col-md-6 {
          position: relative;
          width: 100%;
          padding-left: 15px;
          padding-right: 15px;
          flex: 0 0 100%;
          max-width: 100%;
        }

        @media (min-width: 768px) {
          .col-md-6 {
            flex: 0 0 50%;
            max-width: 50%;
          }

          .offset-md-3 {
            margin-left: 25%;
          }
        }

        /* Mobile order classes */
        @media (max-width: 767px) {
          .m-order-0 {
            order: 0;
          }

          .m-order-1 {
            order: 1;
          }
        }

        /* Responsive typography */
        @media (max-width: 767px) {
          .text-4xl {
            font-size: 1.875rem !important;
          }

          .text-3xl {
            font-size: 1.5rem !important;
          }

          .text-2xl {
            font-size: 1.25rem !important;
          }

          .text-xl {
            font-size: 1.125rem !important;
          }
        }

        /* Mobile section padding */
        @media (max-width: 767px) {
          .row {
            margin-left: 0;
            margin-right: 0;
          }

          .col-md-6 {
            padding-left: 1rem;
            padding-right: 1rem;
          }

          .px-md-5 {
            padding-left: 1rem !important;
            padding-right: 1rem !important;
          }

          .py-5 {
            padding-top: 2rem !important;
            padding-bottom: 2rem !important;
          }
        }

        /* Utility classes used in About page */
        .d-flex {
          display: flex !important;
        }

        .justify-content-center {
          justify-content: center !important;
        }

        .align-items-center {
          align-items: center !important;
        }

        .flex-column {
          flex-direction: column !important;
        }

        .w-100 {
          width: 100% !important;
        }

        .h-auto {
          height: auto !important;
        }

        .border {
          border: 1px solid #e5e7eb;
        }

        .mb-4 {
          margin-bottom: 1rem !important;
        }

        .mb-3 {
          margin-bottom: 0.75rem !important;
        }
      `}</style>

      <main className="min-h-screen bg-white">
        <div className="container pt-4">

        {/* SECTION 1: Media Left, Content Right */}
        <section className="row">
          {sections[0]?.mediaType !== 'none' && (sections[0]?.image || sections[0]?.videoUrl) && (
            <div className="d-flex col-md-6 justify-content-center align-items-center border">
              {sections[0]?.image ? (
                <Image
                  src={sections[0].image}
                  alt="SGS Locations Office"
                  width={800}
                  height={600}
                  className="w-100 h-auto"
                  priority
                />
              ) : sections[0]?.videoUrl ? (
                <div className="w-100" style={{ padding: '56.25% 0 0 0', position: 'relative' }}>
                  <video
                    src={sections[0].videoUrl}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                    controls
                  />
                </div>
              ) : null}
            </div>
          )}
          <div className="col-md-6 d-flex justify-content-center align-items-center flex-column px-md-5 py-5">
            <div className="w-100">
              <div className="d-flex align-items-center mb-4" style={{ gap: '0.75rem' }}>
                <Camera className="text-[#dc2626]" style={{ width: '2.5rem', height: '2.5rem' }} />
                <span className="text-2xl font-bold text-gray-900">
                  SGS LOCATIONS<sup className="text-sm">®</sup>
                </span>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{sections[0]?.title || "The Art of Locations™"}</h1>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                {sections[0]?.subtitle || "SGS Locations: Your Premier Destination for Exclusive Filming Locations in Dallas-Fort Worth"}
              </h2>
              <p className="mb-3 text-gray-700">
                {sections[0]?.content || "For over 20 years, SGS Locations has been a leading provider of exclusive filming locations in the Dallas-Fort Worth metroplex. Originally founded to serve the growing Texas film industry, the company has built an impressive portfolio of over 65+ locations spanning from Denton to Arlington. SGS Locations specializes in a wide range of productions, including commercials, television series, feature films, and still photography. Our impressive list of clients includes productions like Paramount's Landman, Taylor Sheridan's Yellowstone universe, and numerous national commercials. Our dedicated team includes location scouts, photographers, permitting specialists, and production coordinators who work together to provide an unparalleled service experience."}
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 2: Media Section - Content Left, Image/Video Right */}
        <section className="row">
          <div className="col-md-6 py-5 px-md-5 d-flex justify-content-center align-items-center flex-column m-order-1">
            <div className="w-100">
              <h3 className="h3 text-2xl font-semibold text-gray-900 mb-4">
                {sections[1]?.title || "Discover Our Locations"}
              </h3>
              <p className="text-gray-700 mb-4">
                {sections[1]?.content || "Whether you're looking for a sprawling ranch, modern architecture, historic properties, or urban settings, SGS Locations has the perfect backdrop for your production needs."}
              </p>
              {sections[1]?.linkText && sections[1]?.linkUrl && (
                <Link href={sections[1].linkUrl} className="text-[#dc2626] hover:underline font-medium">
                  {sections[1].linkText}
                </Link>
              )}
            </div>
          </div>
          <div className="d-flex col-md-6 justify-content-center align-items-center border m-order-0">
            {/* Show image if available, otherwise show video */}
            {sections[1]?.image ? (
              <Image
                src={sections[1].image}
                alt="Discover Our Locations"
                width={800}
                height={600}
                className="w-100 h-auto"
              />
            ) : sections[1]?.videoUrl ? (
              <div className="w-100" style={{ padding: '56.25% 0 0 0', position: 'relative' }}>
                <iframe
                  src={sections[1].videoUrl}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                  frameBorder="0"
                  allow="autoplay; fullscreen"
                  allowFullScreen
                  title="SGS Locations Overview"
                />
              </div>
            ) : (
              <div className="w-100 d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <p className="text-gray-400">No media available</p>
              </div>
            )}
          </div>
        </section>

        {/* SECTION 3: Media Left, Content Right */}
        {(sections[2]?.title || sections[2]?.content) && (
          <section className="row">
            {sections[2]?.mediaType !== 'none' && (sections[2]?.image || sections[2]?.videoUrl) && (
              <div className="d-flex col-md-6 justify-content-center align-items-center border">
                {sections[2]?.image ? (
                  <Image
                    src={sections[2].image}
                    alt={sections[2]?.title || "Section 3"}
                    width={800}
                    height={600}
                    className="w-100 h-auto"
                  />
                ) : sections[2]?.videoUrl ? (
                  <div className="w-100" style={{ padding: '56.25% 0 0 0', position: 'relative' }}>
                    <video
                      src={sections[2].videoUrl}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                      controls
                    />
                  </div>
                ) : null}
              </div>
            )}
            <div className="col-md-6 d-flex justify-content-center align-items-center flex-column px-md-5 py-5">
              <div className="w-100">
                <h3 className="h3 text-2xl font-semibold text-gray-900 mb-4">
                  {sections[2]?.title || "Trusted by Major Productions"}
                </h3>
                <p className="mb-4 text-gray-700">
                  {sections[2]?.content || "SGS Locations provides exclusive filming locations to the entertainment industry for motion picture, television, commercial, and print projects across the Dallas-Fort Worth area."}
                </p>
                {sections[2]?.linkText && sections[2]?.linkUrl && (
                  <Link
                    href={sections[2].linkUrl}
                    className="text-[#dc2626] hover:underline font-medium"
                    target={sections[2].linkUrl.startsWith('http') ? '_blank' : undefined}
                    rel={sections[2].linkUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
                  >
                    {sections[2].linkText}
                  </Link>
                )}
              </div>
            </div>
          </section>
        )}

        {/* SECTION 4: Media Left, Content Right */}
        {(sections[3]?.title || sections[3]?.content) && (
          <section className="row">
            {sections[3]?.mediaType !== 'none' && (sections[3]?.image || sections[3]?.videoUrl) && (
              <div className="d-flex col-md-6 justify-content-center align-items-center border">
                {sections[3]?.image ? (
                  <Image
                    src={sections[3].image}
                    alt={sections[3]?.title || "Dallas Business Journal"}
                    width={800}
                    height={600}
                    className="w-100 h-auto"
                  />
                ) : sections[3]?.videoUrl ? (
                  <div className="w-100" style={{ padding: '56.25% 0 0 0', position: 'relative' }}>
                    <video
                      src={sections[3].videoUrl}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                      controls
                    />
                  </div>
                ) : null}
              </div>
            )}
            <div className="col-md-6 d-flex justify-content-center align-items-center flex-column px-md-5 py-5">
              <div className="w-100">
                <h3 className="h3 text-2xl font-semibold text-gray-900 mb-4">
                  {sections[3]?.title || "Dallas Business Journal | SGS Locations Brings Professional Location Services to DFW"}
                </h3>
                <p className="mb-4 text-gray-700">
                  {sections[3]?.content || "SGS Locations has been featured in the Dallas Business Journal for its innovative approach to connecting property owners with production companies. The article highlights our commitment to excellence and our role in supporting the growing film industry in North Texas."}
                </p>
                {sections[3]?.linkText && sections[3]?.linkUrl && (
                  <Link href={sections[3].linkUrl} className="text-[#dc2626] hover:underline font-medium">
                    {sections[3].linkText}
                  </Link>
                )}
              </div>
            </div>
          </section>
        )}

        {/* SECTION 5: Content Left, Media Right */}
        {(sections[4]?.title || sections[4]?.content) && (
          <section className="row">
            <div className="col-md-6 py-5 px-md-5 d-flex justify-content-center align-items-center flex-column m-order-1">
              <div className="w-100">
                <h3 className="h3 text-2xl font-semibold text-gray-900 mb-4">
                  {sections[4]?.title || "SGS Locations is a proud member of the Film Industry"}
                </h3>
                <p className="mb-4 text-gray-700">
                  {sections[4]?.content || "We are committed to upholding the highest professional standards in the location services industry. Our membership demonstrates our dedication to excellence, ethical business practices, and collaboration with fellow industry professionals to support the growth of film and television production in Texas."}
                </p>
                {sections[4]?.linkText && sections[4]?.linkUrl && (
                  <Link href={sections[4].linkUrl} target="_blank" rel="noopener noreferrer" className="text-[#dc2626] hover:underline font-medium">
                    {sections[4].linkText}
                  </Link>
                )}
              </div>
            </div>
            {sections[4]?.mediaType !== 'none' && (sections[4]?.image || sections[4]?.videoUrl) && (
              <div className="d-flex col-md-6 justify-content-center align-items-center border m-order-0">
                {sections[4]?.image ? (
                  <Image
                    src={sections[4].image}
                    alt={sections[4]?.title || "LMGI Member"}
                    width={800}
                    height={600}
                    className="w-100 h-auto"
                  />
                ) : sections[4]?.videoUrl ? (
                  <div className="w-100" style={{ padding: '56.25% 0 0 0', position: 'relative' }}>
                    <video
                      src={sections[4].videoUrl}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                      controls
                    />
                  </div>
                ) : null}
              </div>
            )}
          </section>
        )}

        {/* SECTION 6: Media Left, Content Right */}
        {(sections[5]?.title || sections[5]?.content) && (
          <section className="row">
            {sections[5]?.mediaType !== 'none' && (sections[5]?.image || sections[5]?.videoUrl) && (
              <div className="d-flex col-md-6 justify-content-center align-items-center border">
                {sections[5]?.image ? (
                  <Image
                    src={sections[5].image}
                    alt={sections[5]?.title || "Texas Film Commission"}
                    width={800}
                    height={600}
                    className="w-100 h-auto"
                  />
                ) : sections[5]?.videoUrl ? (
                  <div className="w-100" style={{ padding: '56.25% 0 0 0', position: 'relative' }}>
                    <video
                      src={sections[5].videoUrl}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                      controls
                    />
                  </div>
                ) : null}
              </div>
            )}
            <div className="col-md-6 d-flex justify-content-center align-items-center flex-column px-md-5 py-5">
              <div className="w-100">
                <h3 className="h3 text-2xl font-semibold text-gray-900 mb-4">
                  {sections[5]?.title || "SGS Locations is in full compliance with the Texas Film Commission"}
                </h3>
                <p className="mb-4 text-gray-700">
                  {sections[5]?.content || "As a licensed location service operating in Texas, we maintain full compliance with all Texas Film Commission regulations and requirements. This ensures that every production we support meets state standards and benefits from available film incentives and support programs."}
                </p>
                {sections[5]?.linkText && sections[5]?.linkUrl && (
                  <Link href={sections[5].linkUrl} target="_blank" rel="noopener noreferrer" className="text-[#dc2626] hover:underline font-medium">
                    {sections[5].linkText}
                  </Link>
                )}
              </div>
            </div>
          </section>
        )}

        {/* SECTION 7: Content Left, Media Right */}
        {(sections[6]?.title || sections[6]?.content) && (
          <section className="row">
            <div className="col-md-6 py-5 px-md-5 d-flex justify-content-center align-items-center flex-column m-order-1">
              <div className="w-100">
                <h3 className="h3 text-2xl font-semibold text-gray-900 mb-4">
                  {sections[6]?.title || "SGS Locations partners with DFWFC"}
                </h3>
                <p className="mb-4 text-gray-700">
                  {sections[6]?.content || "We proudly partner with the Dallas-Fort Worth Film Commission to promote the region as a premier destination for film and television production. Through this partnership, we help connect productions with local resources, talent, and support services."}
                </p>
                {sections[6]?.linkText && sections[6]?.linkUrl && (
                  <Link href={sections[6].linkUrl} target="_blank" rel="noopener noreferrer" className="text-[#dc2626] hover:underline font-medium">
                    {sections[6].linkText}
                  </Link>
                )}
              </div>
            </div>
            {sections[6]?.mediaType !== 'none' && (sections[6]?.image || sections[6]?.videoUrl) && (
              <div className="d-flex col-md-6 justify-content-center align-items-center border m-order-0">
                {sections[6]?.image ? (
                  <Image
                    src={sections[6].image}
                    alt={sections[6]?.title || "DFWFC Partner"}
                    width={800}
                    height={600}
                    className="w-100 h-auto"
                  />
                ) : sections[6]?.videoUrl ? (
                  <div className="w-100" style={{ padding: '56.25% 0 0 0', position: 'relative' }}>
                    <video
                      src={sections[6].videoUrl}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                      controls
                    />
                  </div>
                ) : null}
              </div>
            )}
          </section>
        )}

        {/* SECTION 8: Media Left, Content Right */}
        {(sections[7]?.title || sections[7]?.content) && (
          <section className="row">
            {sections[7]?.mediaType !== 'none' && (sections[7]?.image || sections[7]?.videoUrl) && (
              <div className="d-flex col-md-6 justify-content-center align-items-center border">
                {sections[7]?.image ? (
                  <Image
                    src={sections[7].image}
                    alt={sections[7]?.title || "Featured in Local Media"}
                    width={800}
                    height={600}
                    className="w-100 h-auto"
                  />
                ) : sections[7]?.videoUrl ? (
                  <div className="w-100" style={{ padding: '56.25% 0 0 0', position: 'relative' }}>
                    <video
                      src={sections[7].videoUrl}
                      className="w-100 h-auto"
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                      controls
                    />
                  </div>
                ) : null}
              </div>
            )}
            <div className="col-md-6 d-flex justify-content-center align-items-center flex-column px-md-5 py-5">
              <div className="w-100">
                <h3 className="h3 text-2xl font-semibold text-gray-900 mb-4">
                  {sections[7]?.title || "Featured in Local Media Coverage"}
                </h3>
                <p className="mb-4 text-gray-700">
                  {sections[7]?.content || "SGS Locations has been featured in numerous local media outlets for our role in bringing major productions to the Dallas-Fort Worth area. From supporting blockbuster TV series to facilitating commercial shoots, our work continues to put North Texas on the map as a filming destination."}
                </p>
                {sections[7]?.linkText && sections[7]?.linkUrl && (
                  <Link href={sections[7].linkUrl} className="text-[#dc2626] hover:underline font-medium">
                    {sections[7].linkText}
                  </Link>
                )}
              </div>
            </div>
          </section>
        )}

        {/* SECTION 9: Content Left, Media Right */}
        {(sections[8]?.title || sections[8]?.content) && (
          <section className="row">
            <div className="col-md-6 py-5 px-md-5 d-flex justify-content-center align-items-center flex-column m-order-1">
              <div className="w-100">
                <h3 className="h3 text-2xl font-semibold text-gray-900 mb-4">
                  {sections[8]?.title || "Check out recent recognition we received:"}
                </h3>
                <p className="mb-4 text-gray-700">
                  {sections[8]?.content || "SGS Locations has been recognized by the Dallas business community for excellence in location services and contribution to the local economy. Our work supporting major productions has helped generate significant economic impact for the region."}
                </p>
                {sections[8]?.linkText && sections[8]?.linkUrl && (
                  <Link href={sections[8].linkUrl} className="text-[#dc2626] hover:underline font-medium">
                    {sections[8].linkText}
                  </Link>
                )}
              </div>
            </div>
            {sections[8]?.mediaType !== 'none' && (sections[8]?.image || sections[8]?.videoUrl) && (
              <div className="d-flex col-md-6 justify-content-center align-items-center border m-order-0">
                {sections[8]?.image ? (
                  <Image
                    src={sections[8].image}
                    alt={sections[8]?.title || "Recognition Badge"}
                    width={800}
                    height={600}
                    className="w-100 h-auto"
                  />
                ) : sections[8]?.videoUrl ? (
                  <div className="w-100" style={{ padding: '56.25% 0 0 0', position: 'relative' }}>
                    <video
                      src={sections[8].videoUrl}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                      controls
                    />
                  </div>
                ) : null}
              </div>
            )}
          </section>
        )}

        {/* SECTION 10: Media Left, Content Right */}
        {(sections[9]?.title || sections[9]?.content) && (
          <section className="row">
            {sections[9]?.mediaType !== 'none' && (sections[9]?.image || sections[9]?.videoUrl) && (
              <div className="d-flex col-md-6 justify-content-center align-items-center border">
                {sections[9]?.image ? (
                  <Image
                    src={sections[9].image}
                    alt={sections[9]?.title || "Licensed and Insured"}
                    width={800}
                    height={600}
                    className="w-100 h-auto"
                  />
                ) : sections[9]?.videoUrl ? (
                  <div className="w-100" style={{ padding: '56.25% 0 0 0', position: 'relative' }}>
                    <video
                      src={sections[9].videoUrl}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                      controls
                    />
                  </div>
                ) : null}
              </div>
            )}
            <div className="col-md-6 d-flex justify-content-center align-items-center flex-column px-md-5 py-5">
              <div className="w-100">
                <h3 className="h3 text-2xl font-semibold text-gray-900 mb-4">
                  {sections[9]?.title || "Licensed & Insured"}
                </h3>
                <p className="text-gray-700">
                  {sections[9]?.content || "SGS Locations maintains all required business licenses and comprehensive insurance coverage to protect property owners, production companies, and all parties involved in filming activities. Our commitment to proper licensing and insurance gives our clients peace of mind throughout every project."}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 11: Code of Conduct - Centered */}
        {(sections[10]?.title || sections[10]?.linkText) && (
          <section className="row py-5">
            <div className="offset-md-3 col-md-6 d-flex justify-content-center flex-column px-md-5 py-5 text-center">
              <h6 className="h3 text-3xl font-bold text-gray-900 mb-4">
                {sections[10]?.title || "Professional Filmmakers Code of Conduct"}
              </h6>
              {sections[10]?.linkText && sections[10]?.linkUrl && (
                <a href={sections[10].linkUrl} target="_blank" className="text-[#dc2626] hover:underline font-medium text-lg">
                  {sections[10].linkText}
                </a>
              )}
            </div>
          </section>
        )}

        {/* DYNAMIC SECTIONS: Render any additional sections beyond section 11 */}
        {sections.slice(11).map((section, idx) => (
          <DynamicSection key={idx + 11} section={section} index={idx + 11} />
        ))}

        </div>
      </main>
    </>
  );
}
