'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { CheckCircle } from 'lucide-react';

interface AboutContent {
  [key: string]: any;
}

export default function AboutPage() {
  const [content, setContent] = useState<AboutContent>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAboutContent();
  }, []);

  async function fetchAboutContent() {
    try {
      const { data } = await supabase
        .from('about_page_content')
        .select('*')
        .order('display_order');

      if (data) {
        const organized: AboutContent = {};
        data.forEach(item => {
          if (!organized[item.section]) {
            organized[item.section] = {};
          }
          organized[item.section][item.key] =
            typeof item.value === 'string' ? JSON.parse(item.value) : item.value;
        });
        setContent(organized);
      }
    } catch (error) {
      console.error('Error fetching about content:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section with Video */}
      <section className="relative h-[70vh] overflow-hidden">
        {content.hero?.video_url && content.hero.video_url !== '' && (
          <video
            autoPlay
            muted
            loop
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src={content.hero.video_url} type="video/mp4" />
          </video>
        )}
        {(!content.hero?.video_url || content.hero.video_url === '') && (
          <div
            className="absolute inset-0 w-full h-full bg-cover bg-center"
            style={{backgroundImage: 'url(https://images.pexels.com/photos/380768/pexels-photo-380768.jpeg)'}}
          />
        )}
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 h-full flex flex-col justify-center items-center text-white text-center px-4">
          <h1 className="text-5xl md:text-6xl font-light mb-4">
            {content.hero?.title || 'About SGS Locations'}
          </h1>
          <p className="text-xl md:text-2xl font-light">
            {content.hero?.subtitle || 'Your Premier Location Partner'}
          </p>
        </div>
      </section>

      {/* Mission Section */}
      {content.mission && (
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-light mb-6">{content.mission.title}</h2>
                <p className="text-lg text-gray-700 leading-relaxed">
                  {content.mission.content}
                </p>
              </div>
              <div>
                {content.mission.image && content.mission.image !== '' ? (
                  <Image
                    src={content.mission.image}
                    alt="Our Mission"
                    width={600}
                    height={400}
                    className="rounded-lg shadow-lg"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.pexels.com/photos/416405/pexels-photo-416405.jpeg?auto=compress&cs=tinysrgb&w=600';
                    }}
                  />
                ) : (
                  <Image
                    src="https://images.pexels.com/photos/416405/pexels-photo-416405.jpeg?auto=compress&cs=tinysrgb&w=600"
                    alt="Our Mission"
                    width={600}
                    height={400}
                    className="rounded-lg shadow-lg"
                  />
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Stats Section */}
      {content.stats && (
        <section className="bg-gray-100 py-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {Object.values(content.stats).map((stat: any, index) => (
                <div key={index}>
                  <div className="text-4xl font-bold text-[#e11921] mb-2">
                    {stat.number}
                  </div>
                  <div className="text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Values Section */}
      {content.values && content.values.list && content.values.list.length > 0 && (
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-light text-center mb-12">
              {content.values.title}
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {content.values.list.map((value: any, index: number) => (
                <div key={index} className="flex gap-4">
                  <CheckCircle className="text-[#e11921] flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                    <p className="text-gray-700">{value.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Team Section */}
      {content.team && content.team.members && content.team.members.length > 0 && (
        <section className="bg-gray-50 py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-light text-center mb-12">
              {content.team.title}
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {content.team.members.map((member: any, index: number) => (
                <div key={index} className="text-center">
                  <Image
                    src={member.image}
                    alt={member.name}
                    width={300}
                    height={300}
                    className="rounded-full mx-auto mb-4"
                    onError={(e) => {
                      e.currentTarget.src = `https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=300`;
                    }}
                  />
                  <h3 className="text-xl font-semibold">{member.name}</h3>
                  <p className="text-[#e11921] mb-2">{member.role}</p>
                  <p className="text-gray-600">{member.bio}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
