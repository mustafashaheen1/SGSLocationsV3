'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white pt-[110px]">
      <style jsx>{`
        @media (max-width: 767px) {
          .m-order-1 {
            order: 1 !important;
            border: none !important;
          }
          .m-order-0 {
            order: 0 !important;
            border: none !important;
          }
          .row {
            display: flex;
            flex-direction: column;
          }
        }
      `}</style>

      <div className="container mx-auto px-0">

        {/* SECTION 1: Hero - Image Left, Content Right */}
        <div className="row flex flex-col md:flex-row mb-0">
          <div className="col-md-6 w-full md:w-1/2 p-0 relative h-[400px] md:h-auto md:min-h-[800px]">
            <Image
              src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200"
              alt="Office Building"
              fill
              className="object-cover"
            />
          </div>
          <div className="col-md-6 w-full md:w-1/2 py-12 px-8 md:py-16 md:px-12">
            <Image
              src="https://via.placeholder.com/300x100/DC2626/FFFFFF?text=SGS+Locations"
              alt="SGS Locations Logo"
              width={300}
              height={100}
              className="mb-6"
              style={{ maxWidth: '300px', height: 'auto' }}
            />
            <h1 className="text-4xl font-bold text-gray-900 mb-4">The Art of Locations™</h1>
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              SGS Locations: Your Premier Destination for Exclusive Filming Locations in Dallas-Fort Worth
            </h2>
            <p className="mb-4 text-gray-700 leading-relaxed">
              For over 20 years, SGS Locations has been a leading provider of exclusive filming locations in the Dallas-Fort Worth metroplex. Originally founded to serve the growing Texas film industry, the company has built an impressive portfolio of over 65+ locations spanning from Denton to Arlington.
            </p>
            <p className="mb-4 text-gray-700 leading-relaxed">
              SGS Locations specializes in a wide range of productions, including commercials, television series, feature films, and still photography. Our impressive list of clients includes productions like Paramount's Landman, Taylor Sheridan's Yellowstone universe, and numerous national commercials.
            </p>
            <p className="mb-4 text-gray-700 leading-relaxed">
              Our dedicated team includes location scouts, photographers, permitting specialists, and production coordinators who work together to provide an unparalleled service experience. We continuously seek innovative methods to serve the film industry while maintaining strong relationships with property owners and local communities.
            </p>
            <p className="mb-6 text-gray-700 leading-relaxed">
              Whether you're looking for a sprawling ranch, modern architecture, historic properties, or urban settings, SGS Locations has the perfect backdrop for your production needs.
            </p>

            {/* Video Embed */}
            <div style={{ padding: '56.25% 0 0 0', position: 'relative' }}>
              <iframe
                src="https://player.vimeo.com/video/616445043"
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                frameBorder="0"
                allow="autoplay; fullscreen"
                allowFullScreen
                title="SGS Locations Overview"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: Centered Content */}
        <section className="row py-12 md:py-16">
          <div className="offset-md-2 col-md-8 w-full md:w-2/3 md:mx-auto text-center px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Trusted by Major Productions</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              SGS Locations provides exclusive filming locations to the entertainment industry for motion picture, television, commercial, and print projects across the Dallas-Fort Worth area.
            </p>
            <Link href="/search" className="text-[#dc2626] hover:underline font-medium">
              Learn More About Our Services →
            </Link>
          </div>
        </section>

        {/* SECTION 3: Image Left, Content Right */}
        <section className="row flex flex-col md:flex-row mb-0">
          <div className="col-md-6 w-full md:w-1/2 flex justify-center items-center border border-gray-300 p-12">
            <Image
              src="https://via.placeholder.com/600x400/000000/FFFFFF?text=Dallas+Business+Journal"
              alt="Dallas Business Journal"
              width={600}
              height={400}
              className="w-full h-auto"
            />
          </div>
          <div className="col-md-6 w-full md:w-1/2 flex flex-col justify-center px-8 py-12 md:px-12">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              Dallas Business Journal | SGS Locations Brings Professional Location Services to DFW
            </h3>
            <p className="mb-4 text-gray-700 leading-relaxed">
              SGS Locations has been featured in the Dallas Business Journal for its innovative approach to connecting property owners with production companies. The article highlights our commitment to excellence and our role in supporting the growing film industry in North Texas.
            </p>
            <Link href="#" className="text-[#dc2626] hover:underline font-medium">
              Read Article →
            </Link>
          </div>
        </section>

        {/* SECTION 4: Content Left, Image Right - WITH MOBILE SWAP */}
        <section className="row flex flex-col md:flex-row mb-0">
          <div className="col-md-6 w-full md:w-1/2 py-12 px-8 md:px-12 flex flex-col justify-center m-order-1">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              SGS Locations is a proud member of the Film Industry
            </h3>
            <p className="text-gray-700 leading-relaxed">
              We are committed to upholding the highest professional standards in the location services industry. Our membership demonstrates our dedication to excellence, ethical business practices, and collaboration with fellow industry professionals to support the growth of film and television production in Texas.
            </p>
          </div>
          <div className="col-md-6 w-full md:w-1/2 flex justify-center items-center border border-gray-300 p-12 m-order-0">
            <Image
              src="https://via.placeholder.com/400x400/FDB515/000000?text=LMGI"
              alt="LMGI Logo"
              width={400}
              height={400}
              className="w-full h-auto"
            />
          </div>
        </section>

        {/* SECTION 5: Image Left, Content Right */}
        <section className="row flex flex-col md:flex-row mb-0">
          <div className="col-md-6 w-full md:w-1/2 flex justify-center items-center border border-gray-300 p-12">
            <Image
              src="https://via.placeholder.com/600x400/003DA5/FFFFFF?text=Texas+Film+Commission"
              alt="Texas Film Commission"
              width={600}
              height={400}
              className="w-full h-auto"
            />
          </div>
          <div className="col-md-6 w-full md:w-1/2 flex flex-col justify-center px-8 py-12 md:px-12">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              SGS Locations is in full compliance with the Texas Film Commission
            </h3>
            <p className="text-gray-700 leading-relaxed">
              As a licensed location service operating in Texas, we maintain full compliance with all Texas Film Commission regulations and requirements. This ensures that every production we support meets state standards and benefits from available film incentives and support programs.
            </p>
          </div>
        </section>

        {/* SECTION 6: Content Left, Image Right - WITH MOBILE SWAP */}
        <section className="row flex flex-col md:flex-row mb-0">
          <div className="col-md-6 w-full md:w-1/2 py-12 px-8 md:px-12 flex flex-col justify-center m-order-1">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              SGS Locations partners with DFWFC
            </h3>
            <p className="mb-4 text-gray-700 leading-relaxed">
              We proudly partner with the Dallas-Fort Worth Film Commission to promote the region as a premier destination for film and television production. Through this partnership, we help connect productions with local resources, talent, and support services.
            </p>
            <Link href="https://www.dfwfilmtx.com" target="_blank" rel="noopener noreferrer" className="text-[#dc2626] hover:underline font-medium">
              Visit DFWFC Website →
            </Link>
          </div>
          <div className="col-md-6 w-full md:w-1/2 flex justify-center items-center border border-gray-300 p-12 m-order-0">
            <Image
              src="https://via.placeholder.com/600x400/000000/FFFFFF?text=AICP"
              alt="AICP Logo"
              width={600}
              height={400}
              className="w-full h-auto"
            />
          </div>
        </section>

        {/* SECTION 7: Image Left, Content Right */}
        <section className="row flex flex-col md:flex-row mb-0">
          <div className="col-md-6 w-full md:w-1/2 flex justify-center items-center border border-gray-300 p-12">
            <Image
              src="https://via.placeholder.com/600x400/000000/FFFFFF?text=LA+Times"
              alt="LA Times Logo"
              width={600}
              height={400}
              className="w-full h-auto"
            />
          </div>
          <div className="col-md-6 w-full md:w-1/2 flex flex-col justify-center px-8 py-12 md:px-12">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              Featured in Local Media Coverage
            </h3>
            <p className="mb-4 text-gray-700 leading-relaxed">
              SGS Locations has been featured in numerous local media outlets for our role in bringing major productions to the Dallas-Fort Worth area. From supporting blockbuster TV series to facilitating commercial shoots, our work continues to put North Texas on the map as a filming destination.
            </p>
            <Link href="#" className="text-[#dc2626] hover:underline font-medium">
              Read Full Article →
            </Link>
          </div>
        </section>

        {/* SECTION 8: Content Left, Image Right - WITH MOBILE SWAP */}
        <section className="row flex flex-col md:flex-row mb-0">
          <div className="col-md-6 w-full md:w-1/2 py-12 px-8 md:px-12 flex flex-col justify-center m-order-1">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              Check out recent recognition we received:
            </h3>
            <p className="mb-4 text-gray-700 leading-relaxed">
              SGS Locations has been recognized by the Dallas business community for excellence in location services and contribution to the local economy. Our work supporting major productions has helped generate significant economic impact for the region.
            </p>
            <Link href="#" className="text-[#dc2626] hover:underline font-medium">
              View Recognition →
            </Link>
          </div>
          <div className="col-md-6 w-full md:w-1/2 flex justify-center items-center border border-gray-300 p-12 m-order-0">
            <Image
              src="https://via.placeholder.com/400x300/C82021/FFFFFF?text=Featured+on+Redfin"
              alt="Redfin Featured Badge"
              width={400}
              height={300}
              className="w-full h-auto"
            />
          </div>
        </section>

        {/* SECTION 9: Image Left, Content Right */}
        <section className="row flex flex-col md:flex-row mb-0">
          <div className="col-md-6 w-full md:w-1/2 flex justify-center items-center border border-gray-300 p-12">
            <Image
              src="https://via.placeholder.com/600x800/F5F5F5/333333?text=Business+License"
              alt="Business License"
              width={600}
              height={800}
              className="w-full h-auto"
            />
          </div>
          <div className="col-md-6 w-full md:w-1/2 flex flex-col justify-center px-8 py-12 md:px-12">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              Licensed & Insured
            </h3>
            <p className="text-gray-700 leading-relaxed">
              SGS Locations maintains all required business licenses and comprehensive insurance coverage to protect property owners, production companies, and all parties involved in filming activities. Our commitment to proper licensing and insurance gives our clients peace of mind throughout every project.
            </p>
          </div>
        </section>

        {/* SECTION 10: Code of Conduct - Centered */}
        <section className="row py-12 md:py-16">
          <div className="offset-md-3 col-md-6 w-full md:w-1/2 md:mx-auto text-center px-8">
            <h3 className="text-3xl font-bold text-gray-900 mb-6">
              Professional Filmmakers Code of Conduct
            </h3>
            <Link href="#" className="text-[#dc2626] hover:underline font-medium text-lg inline-block mb-8">
              Professional Filmmakers Code of Conduct PDF →
            </Link>

            <div className="mb-8">
              <Image
                src="https://via.placeholder.com/250x80/DC2626/FFFFFF?text=SGS+Locations"
                alt="SGS Locations Logo"
                width={250}
                height={80}
                className="mx-auto"
                style={{ maxWidth: '250px', height: 'auto' }}
              />
            </div>

            <div className="flex items-center justify-center gap-3 text-2xl text-gray-900">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              <a href="tel:2145550123" className="hover:text-[#dc2626] transition-colors font-semibold">
                (214) 555-0123
              </a>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
