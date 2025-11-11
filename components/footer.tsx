'use client';

import Link from 'next/link';
import { Camera, Facebook, Instagram, Twitter, Linkedin, Mail, Phone, MapPin, Clock } from 'lucide-react';
import { useState } from 'react';
import LoginModal from './LoginModal';

export function Footer() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const quickLinks = [
    { label: 'Search Locations', href: '/search' },
    { label: 'List Your Property', href: '/list-your-property' },
    { label: 'About Us', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'Articles', href: '/articles' },
    { label: 'Login', href: '#', onClick: () => setIsLoginModalOpen(true) },
    { label: 'Register', href: '/register' },
  ];

  const categories = [
    'Estates & Luxury Homes',
    'Modern Architecture',
    'Natural Settings',
    'Urban & Industrial',
    'Historical Properties',
    'Commercial Spaces',
    'Restaurants & Bars',
    'Outdoor Spaces',
  ];

  return (
    <footer className="bg-[#1a2332] text-white">
      <div className="mx-auto px-4 py-16" style={{maxWidth: '1345px'}}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Camera className="w-6 h-6 text-[#e11921]" />
              <span className="text-lg" style={{fontWeight: 300}}>
                SGS LOCATIONS<sup className="text-xs">®</sup>
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6" style={{fontWeight: 300}}>
              Dallas Fort Worth's largest location database connecting property owners with production companies. Over 20 years of experience serving the film and television industry.
            </p>
            <div className="flex gap-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-[#e11921] transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-[#e11921] transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-[#e11921] transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-[#e11921] transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-lg mb-4" style={{fontWeight: 400}}>Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  {link.onClick ? (
                    <button
                      onClick={link.onClick}
                      className="text-gray-400 hover:text-[#e11921] transition-colors text-sm" style={{fontWeight: 300}}
                    >
                      {link.label}
                    </button>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-[#e11921] transition-colors text-sm" style={{fontWeight: 300}}
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg mb-4" style={{fontWeight: 400}}>Location Categories</h3>
            <ul className="space-y-2">
              {categories.map((category) => (
                <li key={category}>
                  <Link
                    href={`/search?category=${encodeURIComponent(category)}`}
                    className="text-gray-400 hover:text-[#e11921] transition-colors text-sm" style={{fontWeight: 300}}
                  >
                    {category}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg mb-4" style={{fontWeight: 400}}>Contact Info</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-gray-400 text-sm" style={{fontWeight: 300}}>
                <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>
                  123 Main Street<br />
                  Dallas, TX 75201
                </span>
              </li>
              <li className="flex items-center gap-3 text-gray-400 text-sm" style={{fontWeight: 300}}>
                <Phone className="w-5 h-5 flex-shrink-0" />
                <span>(214) 555-0123</span>
              </li>
              <li className="flex items-center gap-3 text-gray-400 text-sm" style={{fontWeight: 300}}>
                <Mail className="w-5 h-5 flex-shrink-0" />
                <a href="mailto:info@sgslocations.com" className="hover:text-[#e11921] transition-colors" style={{fontWeight: 300}}>
                  info@sgslocations.com
                </a>
              </li>
              <li className="flex items-start gap-3 text-gray-400 text-sm" style={{fontWeight: 300}}>
                <Clock className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>
                  Monday - Friday: 9:00 AM - 6:00 PM<br />
                  Saturday: 10:00 AM - 4:00 PM<br />
                  Sunday: Closed
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-12 pt-8 text-center text-gray-400 text-sm" style={{fontWeight: 300}}>
          <p>&copy; {new Date().getFullYear()} SGS Locations. All rights reserved.</p>
        </div>
      </div>

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </footer>
  );
}
