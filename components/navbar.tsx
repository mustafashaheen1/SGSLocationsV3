'use client';

import Link from 'next/link';
import { Search, Menu, X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import LoginModal from '@/components/LoginModal';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';

interface NavbarProps {
  siteLogo: string;
  portfolioVisible: boolean;
}

export function Navbar({ siteLogo: initialLogo, portfolioVisible }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [siteLogo, setSiteLogo] = useState<string>(initialLogo);
  const pathname = usePathname();
  const router = useRouter();
  const isHomepage = pathname === '/';
  const { isAuthenticated, userEmail, userType } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const navItems: Array<{ label: string; href: string; isButton?: boolean }> = [
    { label: 'SEARCH', href: '/search' },
    ...(portfolioVisible ? [{ label: 'PORTFOLIO', href: '/portfolio' }] : []),
    { label: 'LOCATION LIBRARY', href: '/location-library' },
    { label: 'ABOUT US', href: '/about' },
    { label: 'CONTACT', href: '/contact' },
    ...(!isAuthenticated || userType === 'property_owner' ? [{ label: 'LIST YOUR PROPERTY', href: '/list-your-property' }] : []),
  ];

  if (isAuthenticated) {
    navItems.push({ label: 'DASHBOARD', href: '/dashboard' });
  } else {
    navItems.push(
      { label: 'LOGIN', href: '/login', isButton: true },
      { label: 'REGISTER', href: '/register' }
    );
  }

  return (
    <nav
      className={`w-full ${
        isHomepage ? 'absolute top-0 left-0 right-0 z-50 text-white' : 'bg-white border-b border-gray-200 text-gray-900'
      }`}
    >
      <div className="mx-auto px-4">
        <div className="flex items-center justify-between h-[60px]">
          <Link href="/" className="flex items-center gap-3">
            {siteLogo && (
              <img
                src={siteLogo}
                alt="SGS Locations Logo"
                className="h-10 w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  setSiteLogo('');
                }}
              />
            )}
          </Link>


          <button
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        <div className="hidden lg:flex items-center justify-center h-[50px] border-t border-opacity-20 border-current">
          <div className="flex items-center gap-1 text-xs tracking-widest" style={{fontWeight: 300}}>
            {navItems.map((item, index) => (
              <div key={item.label} className="flex items-center">
                {index > 0 && <span className="mx-2 opacity-50">|</span>}
                {item.label === 'LOGIN' && item.isButton ? (
                  <button
                    onClick={() => setIsLoginModalOpen(true)}
                    className="text-xs tracking-wider hover:text-gray-600 transition-colors"
                    style={{ fontWeight: 300 }}
                  >
                    {item.label}
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className="text-xs tracking-wider hover:text-gray-600 transition-colors"
                    style={{ fontWeight: 300 }}
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-gray-900">
          <div className="flex justify-between items-center p-4 border-b border-gray-700">
            <span className="text-white text-lg font-semibold">Menu</span>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="text-white"
              aria-label="Close menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex flex-col items-start gap-4 px-6 py-8">


            {navItems.map((item) => (
              item.label === 'LOGIN' && item.isButton ? (
                <button
                  key={item.href}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setIsLoginModalOpen(true);
                  }}
                  className="text-white text-base tracking-widest hover:text-brand transition-colors py-3 w-full text-left" style={{fontWeight: 300}}
                >
                  {item.label}
                </button>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-white text-base tracking-widest hover:text-brand transition-colors py-3 block w-full" style={{fontWeight: 300}}
                >
                  {item.label}
                </Link>
              )
            ))}
          </div>
        </div>
      )}

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </nav>
  );
}
