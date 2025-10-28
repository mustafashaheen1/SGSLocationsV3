import Link from 'next/link';
import { Camera, Facebook, Instagram, Twitter, Linkedin, Mail, Phone, MapPin, Clock } from 'lucide-react';

export function Footer() {
  const quickLinks = [
    { label: 'Search Locations', href: '/search' },
    { label: 'List Your Property', href: '/list-property' },
    { label: 'About Us', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'Articles', href: '/articles' },
    { label: 'Login', href: '/login' },
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
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Camera className="w-6 h-6 text-[#dc2626]" />
              <span className="text-lg font-bold">
                SGS LOCATIONS<sup className="text-xs">®</sup>
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Dallas Fort Worth's largest location database connecting property owners with production companies. Over 20 years of experience serving the film and television industry.
            </p>
            <div className="flex gap-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-[#dc2626] transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-[#dc2626] transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-[#dc2626] transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-[#dc2626] transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-[#dc2626] transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">Location Categories</h3>
            <ul className="space-y-2">
              {categories.map((category) => (
                <li key={category}>
                  <Link
                    href={`/search?category=${encodeURIComponent(category)}`}
                    className="text-gray-400 hover:text-[#dc2626] transition-colors text-sm"
                  >
                    {category}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">Contact Info</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-gray-400 text-sm">
                <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>
                  123 Main Street<br />
                  Dallas, TX 75201
                </span>
              </li>
              <li className="flex items-center gap-3 text-gray-400 text-sm">
                <Phone className="w-5 h-5 flex-shrink-0" />
                <span>(214) 555-0123</span>
              </li>
              <li className="flex items-center gap-3 text-gray-400 text-sm">
                <Mail className="w-5 h-5 flex-shrink-0" />
                <a href="mailto:info@sgslocations.com" className="hover:text-[#dc2626] transition-colors">
                  info@sgslocations.com
                </a>
              </li>
              <li className="flex items-start gap-3 text-gray-400 text-sm">
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

        <div className="border-t border-gray-700 mt-12 pt-8 text-center text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} SGS Locations. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
