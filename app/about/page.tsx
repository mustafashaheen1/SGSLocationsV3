'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Camera } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface SectionContent {
  image?: string;
  title?: string;
  subtitle?: string;
  content?: string;
  linkText?: string;
  linkUrl?: string;
  videoUrl?: string;
}

export default function AboutPage() {
  const [sections, setSections] = useState<SectionContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, []);

  async function fetchContent() {
    const { data } = await supabase
      .from('site_content')
      .select('*')
      .eq('page', 'about')
      .order('section');

    if (data && data.length > 0) {
      const sectionData: SectionContent[] = [];
      for (let i = 0; i < 11; i++) {
        const section = data.find(d => d.section === `section_${i + 1}`);
        sectionData.push(section?.content_value || getDefaultContent(i));
      }
      setSections(sectionData);
    } else {
      setSections(Array.from({ length: 11 }, (_, i) => getDefaultContent(i)));
    }
    setLoading(false);
  }

  function getDefaultContent(index: number): SectionContent {
    const defaults = [
      {
        image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
        title: 'The Art of Locations™',
        subtitle: 'SGS Locations: Your Premier Destination for Exclusive Filming Locations in Dallas-Fort Worth',
        content: `For over 20 years, SGS Locations has been a leading provider of exclusive filming locations in the Dallas-Fort Worth metroplex. Originally founded to serve the growing Texas film industry, the company has built an impressive portfolio of over 65+ locations spanning from Denton to Arlington.

SGS Locations specializes in a wide range of productions, including commercials, television series, feature films, and still photography. Our impressive list of clients includes productions like Paramount's Landman, Taylor Sheridan's Yellowstone universe, and numerous national commercials.

Our dedicated team includes location scouts, photographers, permitting specialists, and production coordinators who work together to provide an unparalleled service experience.`
      },
      {
        title: 'Discover Our Locations',
        content: 'Whether you\'re looking for a sprawling ranch, modern architecture, historic properties, or urban settings, SGS Locations has the perfect backdrop for your production needs. Watch our overview video to see what we offer.',
        videoUrl: 'https://player.vimeo.com/video/616445043'
      },
      {
        title: 'Trusted by Major Productions',
        content: 'SGS Locations provides exclusive filming locations to the entertainment industry for motion picture, television, commercial, and print projects across the Dallas-Fort Worth area.',
        linkText: 'Learn More About Our Services →',
        linkUrl: '/search'
      },
      {
        image: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800',
        title: 'Dallas Business Journal | SGS Locations Brings Professional Location Services to DFW',
        content: 'SGS Locations has been featured in the Dallas Business Journal for its innovative approach to connecting property owners with production companies. The article highlights our commitment to excellence and our role in supporting the growing film industry in North Texas.',
        linkText: 'Read Article →',
        linkUrl: '#'
      },
      {
        image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800',
        title: 'SGS Locations is a proud member of the Film Industry',
        content: 'We are committed to upholding the highest professional standards in the location services industry. Our membership demonstrates our dedication to excellence, ethical business practices, and collaboration with fellow industry professionals to support the growth of film and television production in Texas.'
      },
      {
        image: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800',
        title: 'SGS Locations is in full compliance with the Texas Film Commission',
        content: 'As a licensed location service operating in Texas, we maintain full compliance with all Texas Film Commission regulations and requirements. This ensures that every production we support meets state standards and benefits from available film incentives and support programs.'
      },
      {
        image: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800',
        title: 'SGS Locations partners with DFWFC',
        content: 'We proudly partner with the Dallas-Fort Worth Film Commission to promote the region as a premier destination for film and television production. Through this partnership, we help connect productions with local resources, talent, and support services.',
        linkText: 'Visit DFWFC Website →',
        linkUrl: 'https://www.dfwfilmtx.com'
      },
      {
        image: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800',
        title: 'Featured in Local Media Coverage',
        content: 'SGS Locations has been featured in numerous local media outlets for our role in bringing major productions to the Dallas-Fort Worth area. From supporting blockbuster TV series to facilitating commercial shoots, our work continues to put North Texas on the map as a filming destination.',
        linkText: 'Read Full Article →',
        linkUrl: '#'
      },
      {
        image: 'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=800',
        title: 'Check out recent recognition we received:',
        content: 'SGS Locations has been recognized by the Dallas business community for excellence in location services and contribution to the local economy. Our work supporting major productions has helped generate significant economic impact for the region.',
        linkText: 'View Recognition →',
        linkUrl: '#'
      },
      {
        image: 'https://images.unsplash.com/photo-1554224311-beee460c201f?w=800',
        title: 'Licensed & Insured',
        content: 'SGS Locations maintains all required business licenses and comprehensive insurance coverage to protect property owners, production companies, and all parties involved in filming activities. Our commitment to proper licensing and insurance gives our clients peace of mind throughout every project.'
      },
      {
        title: 'Professional Filmmakers Code of Conduct',
        linkText: 'Professional Filmmakers Code of Conduct PDF',
        linkUrl: '/pdfs/code-of-conduct.pdf'
      }
    ];
    return defaults[index] || {};
  }

  function renderParagraphs(content: string) {
    return content.split('\n\n').map((para, idx) => (
      <p key={idx} className="mb-3 text-gray-700">{para}</p>
    ));
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="container pt-4">

        {/* SECTION 1: Image Left, Content Right */}
        <section className="row">
          <div className="d-flex col-md-6 justify-content-center align-items-center border">
            <Image
              src={sections[0]?.image || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800'}
              alt="SGS Locations Office"
              width={800}
              height={600}
              className="w-100 h-auto"
              priority
            />
          </div>
          <div className="col-md-6 d-flex justify-content-center align-items-center flex-column px-md-5 py-5">
            <div className="w-100">
              <div className="d-flex align-items-center mb-4" style={{ gap: '0.75rem' }}>
                <Camera className="text-[#dc2626]" style={{ width: '2.5rem', height: '2.5rem' }} />
                <span className="text-2xl font-bold text-gray-900">
                  SGS LOCATIONS<sup className="text-sm">®</sup>
                </span>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{sections[0]?.title || 'The Art of Locations™'}</h1>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                {sections[0]?.subtitle || 'SGS Locations: Your Premier Destination for Exclusive Filming Locations in Dallas-Fort Worth'}
              </h2>
              {sections[0]?.content && renderParagraphs(sections[0].content)}
            </div>
          </div>
        </section>

        {/* SECTION 2: Video Section - Content Left, Image Right */}
        <section className="row">
          <div className="col-md-6 py-5 px-md-5 d-flex justify-content-center align-items-center flex-column m-order-1">
            <div className="w-100">
              <h3 className="h3 text-2xl font-semibold text-gray-900 mb-4">
                {sections[1]?.title || 'Discover Our Locations'}
              </h3>
              <p className="text-gray-700 mb-4">
                {sections[1]?.content || 'Whether you\'re looking for a sprawling ranch, modern architecture, historic properties, or urban settings, SGS Locations has the perfect backdrop for your production needs. Watch our overview video to see what we offer.'}
              </p>
            </div>
          </div>
          <div className="d-flex col-md-6 justify-content-center align-items-center border m-order-0">
            <div className="w-100" style={{ padding: '56.25% 0 0 0', position: 'relative' }}>
              <iframe
                src={sections[1]?.videoUrl || 'https://player.vimeo.com/video/616445043'}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                frameBorder="0"
                allow="autoplay; fullscreen"
                allowFullScreen
                title="SGS Locations Overview"
              />
            </div>
          </div>
        </section>

        {/* SECTION 3: Centered Content */}
        <section className="row py-5">
          <div className="offset-md-3 col-md-6 d-flex justify-content-center flex-column px-md-5 py-5 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{sections[2]?.title || 'Trusted by Major Productions'}</h2>
            <p className="mb-4 text-gray-700">
              {sections[2]?.content || 'SGS Locations provides exclusive filming locations to the entertainment industry for motion picture, television, commercial, and print projects across the Dallas-Fort Worth area.'}
            </p>
            {sections[2]?.linkUrl && (
              <Link href={sections[2].linkUrl} className="text-[#dc2626] hover:underline font-medium">
                {sections[2]?.linkText || 'Learn More →'}
              </Link>
            )}
          </div>
        </section>

        {/* SECTION 4: Image Left, Content Right */}
        <section className="row">
          <div className="d-flex col-md-6 justify-content-center align-items-center border">
            <Image
              src={sections[3]?.image || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800'}
              alt="Dallas Business Journal"
              width={800}
              height={600}
              className="w-100 h-auto"
            />
          </div>
          <div className="col-md-6 d-flex justify-content-center align-items-center flex-column px-md-5 py-5">
            <div className="w-100">
              <h3 className="h3 text-2xl font-semibold text-gray-900 mb-4">
                {sections[3]?.title || 'Dallas Business Journal | SGS Locations Brings Professional Location Services to DFW'}
              </h3>
              {sections[3]?.content && renderParagraphs(sections[3].content)}
              {sections[3]?.linkUrl && (
                <Link href={sections[3].linkUrl} className="text-[#dc2626] hover:underline font-medium">
                  {sections[3]?.linkText || 'Read Article →'}
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* SECTION 5: Content Left, Image Right */}
        <section className="row">
          <div className="col-md-6 py-5 px-md-5 d-flex justify-content-center align-items-center flex-column m-order-1">
            <div className="w-100">
              <h3 className="h3 text-2xl font-semibold text-gray-900 mb-4">
                {sections[4]?.title || 'SGS Locations is a proud member of the Film Industry'}
              </h3>
              {sections[4]?.content && renderParagraphs(sections[4].content)}
              {sections[4]?.linkUrl && (
                <Link href={sections[4].linkUrl} className="text-[#dc2626] hover:underline font-medium">
                  {sections[4]?.linkText || 'Learn More →'}
                </Link>
              )}
            </div>
          </div>
          <div className="d-flex col-md-6 justify-content-center align-items-center border m-order-0">
            <Image
              src={sections[4]?.image || 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800'}
              alt="LMGI Member"
              width={800}
              height={600}
              className="w-100 h-auto"
            />
          </div>
        </section>

        {/* SECTION 6: Image Left, Content Right */}
        <section className="row">
          <div className="d-flex col-md-6 justify-content-center align-items-center border">
            <Image
              src={sections[5]?.image || 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800'}
              alt="Texas Film Commission"
              width={800}
              height={600}
              className="w-100 h-auto"
            />
          </div>
          <div className="col-md-6 d-flex justify-content-center align-items-center flex-column px-md-5 py-5">
            <div className="w-100">
              <h3 className="h3 text-2xl font-semibold text-gray-900 mb-4">
                {sections[5]?.title || 'SGS Locations is in full compliance with the Texas Film Commission'}
              </h3>
              {sections[5]?.content && renderParagraphs(sections[5].content)}
              {sections[5]?.linkUrl && (
                <Link href={sections[5].linkUrl} className="text-[#dc2626] hover:underline font-medium">
                  {sections[5]?.linkText || 'Learn More →'}
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* SECTION 7: Content Left, Image Right */}
        <section className="row">
          <div className="col-md-6 py-5 px-md-5 d-flex justify-content-center align-items-center flex-column m-order-1">
            <div className="w-100">
              <h3 className="h3 text-2xl font-semibold text-gray-900 mb-4">
                {sections[6]?.title || 'SGS Locations partners with DFWFC'}
              </h3>
              {sections[6]?.content && renderParagraphs(sections[6].content)}
              {sections[6]?.linkUrl && (
                <Link href={sections[6].linkUrl} target="_blank" rel="noopener noreferrer" className="text-[#dc2626] hover:underline font-medium">
                  {sections[6]?.linkText || 'Visit DFWFC Website →'}
                </Link>
              )}
            </div>
          </div>
          <div className="d-flex col-md-6 justify-content-center align-items-center border m-order-0">
            <Image
              src={sections[6]?.image || 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800'}
              alt="DFWFC Partner"
              width={800}
              height={600}
              className="w-100 h-auto"
            />
          </div>
        </section>

        {/* SECTION 8: Image Left, Content Right */}
        <section className="row">
          <div className="d-flex col-md-6 justify-content-center align-items-center border">
            <Image
              src={sections[7]?.image || 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800'}
              alt="Featured in Local Media"
              width={800}
              height={600}
              className="w-100 h-auto"
            />
          </div>
          <div className="col-md-6 d-flex justify-content-center align-items-center flex-column px-md-5 py-5">
            <div className="w-100">
              <h3 className="h3 text-2xl font-semibold text-gray-900 mb-4">
                {sections[7]?.title || 'Featured in Local Media Coverage'}
              </h3>
              {sections[7]?.content && renderParagraphs(sections[7].content)}
              {sections[7]?.linkUrl && (
                <Link href={sections[7].linkUrl} className="text-[#dc2626] hover:underline font-medium">
                  {sections[7]?.linkText || 'Read Full Article →'}
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* SECTION 9: Content Left, Image Right */}
        <section className="row">
          <div className="col-md-6 py-5 px-md-5 d-flex justify-content-center align-items-center flex-column m-order-1">
            <div className="w-100">
              <h3 className="h3 text-2xl font-semibold text-gray-900 mb-4">
                {sections[8]?.title || 'Check out recent recognition we received:'}
              </h3>
              {sections[8]?.content && renderParagraphs(sections[8].content)}
              {sections[8]?.linkUrl && (
                <Link href={sections[8].linkUrl} className="text-[#dc2626] hover:underline font-medium">
                  {sections[8]?.linkText || 'View Recognition →'}
                </Link>
              )}
            </div>
          </div>
          <div className="d-flex col-md-6 justify-content-center align-items-center border m-order-0">
            <Image
              src={sections[8]?.image || 'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=800'}
              alt="Recognition Badge"
              width={800}
              height={600}
              className="w-100 h-auto"
            />
          </div>
        </section>

        {/* SECTION 10: Image Left, Content Right */}
        <section className="row">
          <div className="d-flex col-md-6 justify-content-center align-items-center border">
            <Image
              src={sections[9]?.image || 'https://images.unsplash.com/photo-1554224311-beee460c201f?w=800'}
              alt="Licensed and Insured"
              width={800}
              height={600}
              className="w-100 h-auto"
            />
          </div>
          <div className="col-md-6 d-flex justify-content-center align-items-center flex-column px-md-5 py-5">
            <div className="w-100">
              <h3 className="h3 text-2xl font-semibold text-gray-900 mb-4">
                {sections[9]?.title || 'Licensed & Insured'}
              </h3>
              {sections[9]?.content && renderParagraphs(sections[9].content)}
              {sections[9]?.linkUrl && (
                <Link href={sections[9].linkUrl} className="text-[#dc2626] hover:underline font-medium">
                  {sections[9]?.linkText || 'Learn More →'}
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* SECTION 11: Code of Conduct - Centered */}
        <section className="row py-5">
          <div className="offset-md-3 col-md-6 d-flex justify-content-center flex-column px-md-5 py-5 text-center">
            <h6 className="h3 text-3xl font-bold text-gray-900 mb-4">
              {sections[10]?.title || 'Professional Filmmakers Code of Conduct'}
            </h6>
            {sections[10]?.linkUrl && (
              <a href={sections[10].linkUrl} target="_blank" className="text-[#dc2626] hover:underline font-medium text-lg">
                {sections[10]?.linkText || 'Professional Filmmakers Code of Conduct PDF'}
              </a>
            )}
          </div>
        </section>

      </div>
    </main>
  );
}
