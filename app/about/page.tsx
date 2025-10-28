import { Award, Users, Target, Heart } from 'lucide-react';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white pt-[110px]">
      <section className="py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">About SGS Locations</h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            For over 20 years, SGS Locations has been the premier location scouting service in the Dallas-Fort Worth area, connecting property owners with production companies for film, television, and commercial projects.
          </p>
        </div>
      </section>

      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Story</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Founded in 2004, SGS Locations began with a simple mission: to showcase the diverse and stunning locations that the Dallas-Fort Worth metroplex has to offer to the entertainment industry.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Over the years, we've worked with major studios, independent filmmakers, and commercial production companies, helping them find the perfect settings for their projects while creating opportunities for property owners to participate in the exciting world of film and television production.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Today, we manage one of the largest databases of filming locations in North and Central Texas, with over 65 properties ranging from modern architecture to historical estates.
              </p>
            </div>
            <div className="bg-gray-200 aspect-[4/3] rounded-lg"></div>
          </div>

          <div className="grid md:grid-cols-4 gap-8 mb-24">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#dc2626] text-white rounded-full mb-4">
                <Award className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Excellence</h3>
              <p className="text-gray-600">Committed to providing the highest quality locations and service</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#dc2626] text-white rounded-full mb-4">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Community</h3>
              <p className="text-gray-600">Building relationships between property owners and production professionals</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#dc2626] text-white rounded-full mb-4">
                <Target className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Results</h3>
              <p className="text-gray-600">Delivering perfect location matches for every production</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#dc2626] text-white rounded-full mb-4">
                <Heart className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Passion</h3>
              <p className="text-gray-600">Passionate about showcasing Texas locations to the world</p>
            </div>
          </div>

          <div className="bg-[#1a3a5a] text-white rounded-lg p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-xl mb-8">Whether you're looking for the perfect location or want to list your property, we're here to help.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/search" className="inline-block bg-[#dc2626] hover:bg-[#b91c1c] text-white font-semibold px-8 py-3 rounded-lg transition-colors">
                Search Locations
              </a>
              <a href="/list-property" className="inline-block bg-white text-[#1a3a5a] hover:bg-gray-100 font-semibold px-8 py-3 rounded-lg transition-colors">
                List Your Property
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
