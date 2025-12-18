'use client';

import Link from 'next/link';
import { Search, Camera, Menu, X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import LoginModal from '@/components/LoginModal';
import { supabase } from '@/lib/supabase';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [showPortfolio, setShowPortfolio] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const isHomepage = pathname === '/';

  useEffect(() => {
    checkAuth();
    fetchPortfolioVisibility();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Check if user exists in USERS table (not just auth)
        const { directFetch } = await import('@/lib/supabase');
        const { data: userData } = await directFetch('users', {
          select: 'user_type',
          eq: { id: session.user.id },
          single: true,
          authToken: session.access_token
        });

        // Only show as authenticated if they're in the users table
        if (userData) {
          setIsAuthenticated(true);
          setUserEmail(session.user.email || null);
          setUserType(userData.user_type || null);
        } else {
          // User is in auth but NOT in users table (admin-only account)
          setIsAuthenticated(false);
          setUserEmail(null);
          setUserType(null);
        }
      } else {
        setIsAuthenticated(false);
        setUserEmail(null);
        setUserType(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function fetchPortfolioVisibility() {
    try {
      const { data } = await (supabase
        .from('site_settings') as any)
        .select('value')
        .eq('key', 'portfolio_visible')
        .maybeSingle();

      if (data && data.value) {
        const value = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
        setShowPortfolio(value === true || value === 'true');
      }
    } catch (error) {
      console.error('Error fetching portfolio visibility:', error);
    }
  }


  async function checkAuth() {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        // Check if user exists in USERS table
        const { directFetch } = await import('@/lib/supabase');
        const { data: userData } = await directFetch('users', {
          select: 'user_type',
          eq: { id: session.user.id },
          single: true,
          authToken: session.access_token
        });

        // Only show as authenticated if they're in the users table
        if (userData) {
          setIsAuthenticated(true);
          setUserEmail(session.user.email || null);
          setUserType(userData.user_type || null);
        } else {
          // Admin-only account - don't show as logged in on main site
          setIsAuthenticated(false);
          setUserEmail(null);
          setUserType(null);
        }
      } else {
        setIsAuthenticated(false);
        setUserEmail(null);
        setUserType(null);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      setIsAuthenticated(false);
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUserEmail(null);
    router.push('/');
  };

  const navItems: Array<{ label: string; href: string; isButton?: boolean }> = [
    { label: 'SEARCH', href: '/search' },
    ...(showPortfolio ? [{ label: 'PORTFOLIO', href: '/portfolio' }] : []),
    { label: 'LOCATION LIBRARY', href: '/location-library' },
    { label: 'ABOUT US', href: '/about' },
    { label: 'CONTACT', href: '/contact' },
    // Only show "List Your Property" if user is not logged in OR is a property_owner
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
          <Link href="/" className="flex items-center gap-2">
            <Camera className="w-8 h-8 text-[#e11921]" />
            <span className="text-xl tracking-tight" style={{fontWeight: 300}}>
              SGS LOCATIONS<sup className="text-xs">®</sup>
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-3">
            <form onSubmit={handleSearch} className="flex items-center">
              <Input
                type="text"
                placeholder="Search locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full max-w-[350px] ${isHomepage ? 'bg-white/90 text-gray-900' : 'bg-white'}`}
              />
              <Button
                type="submit"
                size="sm"
                className="ml-2 bg-[#e11921] hover:bg-[#bf151c] rounded" style={{fontWeight: 300, padding: '0.375rem 0.75rem'}}
              >
                <Search className="w-4 h-4" />
              </Button>
            </form>

          </div>

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
            <form onSubmit={handleSearch} className="w-full flex gap-2 mb-4">
              <Input
                type="text"
                placeholder="Search locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button
                type="submit"
                className="bg-[#e11921] hover:bg-[#bf151c] rounded" style={{fontWeight: 300}}
              >
                <Search className="w-4 h-4" />
              </Button>
            </form>


            {navItems.map((item) => (
              item.label === 'LOGIN' && item.isButton ? (
                <button
                  key={item.href}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setIsLoginModalOpen(true);
                  }}
                  className="text-white text-base tracking-widest hover:text-[#e11921] transition-colors py-3 w-full text-left" style={{fontWeight: 300}}
                >
                  {item.label}
                </button>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-white text-base tracking-widest hover:text-[#e11921] transition-colors py-3 block w-full" style={{fontWeight: 300}}
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
