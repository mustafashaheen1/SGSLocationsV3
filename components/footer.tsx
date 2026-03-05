'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Facebook, Instagram, Twitter, Linkedin, Youtube, MapPin, Phone, Mail, Clock } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

interface FooterProps {
  siteLogo: string;
  footerContent: {
    description: string;
    phone: string;
    email: string;
    address: string;
    officeHours: string;
  };
  socialLinks: any[];
  categories: any[];
}

export function Footer({ siteLogo: initialLogo, footerContent, socialLinks, categories }: FooterProps) {
  const [siteLogo, setSiteLogo] = useState<string>(initialLogo);
  const { isAuthenticated, userType } = useAuth();

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
              {siteLogo ? (
                <img
                  src={siteLogo}
                  alt="SGS Locations"
                  className="h-10 w-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    setSiteLogo('');
                  }}
                />
              ) : (
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-brand rounded flex items-center justify-center">
                    <span className="text-white font-bold">S</span>
                  </div>
                  <span className="text-xl font-bold">SGS LOCATIONS®</span>
                </div>
              )}
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
          <div className="text-right">
            <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
            <div className="space-y-3 flex flex-col items-end">
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
