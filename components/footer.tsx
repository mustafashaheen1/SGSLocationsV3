'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Facebook, Instagram, Twitter, Linkedin, Youtube, MapPin, Phone, Mail, Clock } from 'lucide-react';

export function Footer() {
  const [footerContent, setFooterContent] = useState({
    description: '',
    phone: '',
    email: '',
    address: ''
  });
  const [socialLinks, setSocialLinks] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFooterContent();
  }, []);

  async function fetchFooterContent() {
    try {
      // Fetch footer settings from site_settings table
      const { data: settings } = await supabase
        .from('site_settings')
        .select('*')
        .in('key', ['footer_description', 'contact_phone', 'contact_email', 'contact_address']);

      if (settings) {
        const description = settings.find(s => s.key === 'footer_description')?.value;
        const phone = settings.find(s => s.key === 'contact_phone')?.value;
        const email = settings.find(s => s.key === 'contact_email')?.value;
        const address = settings.find(s => s.key === 'contact_address')?.value;

        setFooterContent({
          description: description ? description.replace(/^"|"$/g, '') : "Dallas Fort Worth's largest location database connecting property owners with production companies. Over 20 years of experience serving the film and television industry.",
          phone: phone ? phone.replace(/^"|"$/g, '') : '(214) 555-0100',
          email: email ? email.replace(/^"|"$/g, '') : 'info@sgslocations.com',
          address: address ? address.replace(/^"|"$/g, '') : '123 Main Street, Dallas, TX 75201'
        });
      }

      // Fetch social links - ONLY show those with URLs
      const { data: social } = await supabase
        .from('social_links')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (social) {
        // Filter out links with empty or null URLs
        const activeSocial = social.filter(link => link.url && link.url.trim() !== '');
        setSocialLinks(activeSocial);
      }

      // Fetch categories from database
      const { data: cats } = await supabase
        .from('categories')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('display_order')
        .limit(10);

      if (cats) setCategories(cats);

    } catch (error) {
      console.error('Error fetching footer content:', error);
    } finally {
      setLoading(false);
    }
  }

  const getSocialIcon = (platform: string) => {
    const icons: { [key: string]: any } = {
      'facebook': Facebook,
      'instagram': Instagram,
      'twitter': Twitter,
      'linkedin': Linkedin,
      'youtube': Youtube
    };
    return icons[platform.toLowerCase()] || null;
  };

  if (loading) {
    return (
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <p className="text-center">Loading...</p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <Link href="/" className="inline-block mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
                  <span className="text-white font-bold">S</span>
                </div>
                <span className="text-xl font-bold">SGS LOCATIONS®</span>
              </div>
            </Link>
            <p className="text-gray-400 mb-4">
              {footerContent.description}
            </p>
            {/* Social Links - Only show if URL exists */}
            {socialLinks.length > 0 && (
              <div className="flex space-x-3">
                {socialLinks.map(link => {
                  const Icon = getSocialIcon(link.platform);
                  if (!Icon || !link.url) return null;

                  return (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <Icon className="w-5 h-5" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link href="/search" className="text-gray-400 hover:text-white">Search Locations</Link></li>
              <li><Link href="/list-your-property" className="text-gray-400 hover:text-white">List Your Property</Link></li>
              <li><Link href="/about" className="text-gray-400 hover:text-white">About Us</Link></li>
              <li><Link href="/contact" className="text-gray-400 hover:text-white">Contact</Link></li>
              <li><Link href="/articles" className="text-gray-400 hover:text-white">Articles</Link></li>
              <li><Link href="/register" className="text-gray-400 hover:text-white">Register</Link></li>
            </ul>
          </div>

          {/* Location Categories */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Location Categories</h3>
            <ul className="space-y-2">
              {categories.length > 0 ? (
                categories.map(cat => (
                  <li key={cat.id}>
                    <Link
                      href={`/search?category=${cat.slug}`}
                      className="text-gray-400 hover:text-white"
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))
              ) : (
                <li className="text-gray-400">No categories available</li>
              )}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-400">
                  {footerContent.address.split(',').map((line, i) => (
                    <span key={i}>
                      {line.trim()}
                      {i < footerContent.address.split(',').length - 1 && <br />}
                    </span>
                  ))}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <a href={`tel:${footerContent.phone.replace(/\D/g, '')}`} className="text-gray-400 hover:text-white">
                  {footerContent.phone}
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <a href={`mailto:${footerContent.email}`} className="text-gray-400 hover:text-white">
                  {footerContent.email}
                </a>
              </div>
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div className="text-gray-400">
                  <p>Monday - Friday: 9:00 AM - 6:00 PM</p>
                  <p>Saturday: 10:00 AM - 4:00 PM</p>
                  <p>Sunday: Closed</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center">
          <p className="text-gray-400">
            © {new Date().getFullYear()} SGS Locations. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
