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
    address: '',
    officeHours: ''
  });
  const [socialLinks, setSocialLinks] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState<string | null>(null);

  useEffect(() => {
    fetchFooterContent();
    checkAuth();
  }, []);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);

    if (session?.user) {
      const { data: userData } = await supabase
        .from('users')
        .select('user_type')
        .eq('id', session.user.id)
        .maybeSingle() as { data: { user_type: string } | null };

      setUserType(userData?.user_type || null);
    } else {
      setUserType(null);
    }
  }

  // Helper function to parse JSON values with multiple layers of escaping
  const parseValue = (value: any): string => {
    if (!value) return '';
    if (typeof value === 'string') {
      try {
        // Keep parsing until we get a plain string
        let parsed = value;
        while (typeof parsed === 'string' && (parsed.startsWith('"') || parsed.startsWith('\\"'))) {
          parsed = JSON.parse(parsed);
        }
        return parsed;
      } catch (e) {
        // If parsing fails, just remove outer quotes
        return value.replace(/^"|"$/g, '');
      }
    }
    return String(value);
  };

  async function fetchFooterContent() {
    try {
      // Fetch footer settings from site_settings table
      const { data: settings } = await (supabase
        .from('site_settings') as any)
        .select('*')
        .in('key', ['footer_description', 'contact_phone', 'contact_email', 'contact_address', 'office_hours']);

      if (settings) {
        const description = (settings as any[]).find((s: any) => s.key === 'footer_description')?.value;
        const phone = (settings as any[]).find((s: any) => s.key === 'contact_phone')?.value;
        const email = (settings as any[]).find((s: any) => s.key === 'contact_email')?.value;
        const address = (settings as any[]).find((s: any) => s.key === 'contact_address')?.value;
        const officeHours = (settings as any[]).find((s: any) => s.key === 'office_hours')?.value;

        setFooterContent({
          description: parseValue(description) || '',
          phone: parseValue(phone) || '',
          email: parseValue(email) || '',
          address: parseValue(address) || '',
          officeHours: parseValue(officeHours) || ''
        });
      }

      // Fetch social links - ONLY show those with URLs
      const { data: social } = await (supabase
        .from('social_links') as any)
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (social) {
        // Filter out links with empty or null URLs
        const activeSocial = (social as any[]).filter((link: any) => link.url && link.url.trim() !== '');
        setSocialLinks(activeSocial);
      }

      // Fetch categories from database
      const { data: cats } = await (supabase
        .from('categories') as any)
        .select('id, name, slug')
        .eq('is_active', true)
        .order('display_order')
        .limit(10);

      if (cats) setCategories(cats);

    } catch (error) {
      console.error('Error fetching footer content:', error);
      // Keep empty values on error
      setFooterContent({
        description: '',
        phone: '',
        email: '',
        address: '',
        officeHours: ''
      });
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
      <footer className="bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-4">
                <div className="h-6 bg-gray-800 rounded animate-pulse w-3/4" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-800 rounded animate-pulse" />
                  <div className="h-4 bg-gray-800 rounded animate-pulse w-5/6" />
                  <div className="h-4 bg-gray-800 rounded animate-pulse w-4/6" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </footer>
    );
  }

  return (
    <>
      <style jsx global>{`
        /* Footer mobile improvements */
        @media (max-width: 767px) {
          footer .container {
            padding-left: 1rem !important;
            padding-right: 1rem !important;
            padding-top: 2rem !important;
            padding-bottom: 2rem !important;
          }

          footer h3 {
            font-size: 1rem !important;
            margin-bottom: 0.75rem !important;
          }

          footer .grid {
            gap: 2rem !important;
          }

          footer .space-y-2 {
            gap: 0.375rem !important;
          }

          footer .text-lg {
            font-size: 1rem !important;
          }
        }

        /* Better word wrapping for contact info */
        footer .text-gray-400 {
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
      `}</style>

      <footer className="bg-gray-900 text-white">
        <div className="container mx-auto px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Company Info */}
          <div>
            <Link href="/" className="inline-block mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-brand rounded flex items-center justify-center">
                  <span className="text-white font-bold">S</span>
                </div>
                <span className="text-xl font-bold">SGS LOCATIONS®</span>
              </div>
            </Link>
            {footerContent.description && (
              <p className="text-gray-400 mb-4">
                {footerContent.description}
              </p>
            )}
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
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link href="/search" className="text-gray-400 hover:text-white">Search Locations</Link></li>
              {(!isAuthenticated || userType === 'property_owner') && (
                <li><Link href="/list-your-property" className="text-gray-400 hover:text-white">List Your Property</Link></li>
              )}
              <li><Link href="/about" className="text-gray-400 hover:text-white">About Us</Link></li>
              <li><Link href="/contact" className="text-gray-400 hover:text-white">Contact</Link></li>
              <li><Link href="/register" className="text-gray-400 hover:text-white">Register</Link></li>
              <li><Link href="/admin/login" className="text-gray-400 hover:text-white">Admin Panel</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
            <div className="space-y-3">
              {footerContent.address && (
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
              )}
              {footerContent.phone && (
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <a href={`tel:${footerContent.phone.replace(/\D/g, '')}`} className="text-gray-400 hover:text-white">
                    {footerContent.phone}
                  </a>
                </div>
              )}
              {footerContent.email && (
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <a href={`mailto:${footerContent.email}`} className="text-gray-400 hover:text-white">
                    {footerContent.email}
                  </a>
                </div>
              )}
              {footerContent.officeHours && (
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div className="text-gray-400">
                    {footerContent.officeHours.split('\n').map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                </div>
              )}
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
    </>
  );
}
