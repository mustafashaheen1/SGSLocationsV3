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
  const pathname = usePathname();
  const router = useRouter();
  const isHomepage = pathname === '/';

  useEffect(() => {
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      setUserEmail(session?.user?.email || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const checkAndLogoutAdmin = async () => {
      if (pathname?.startsWith('/admin')) {
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        const { data: adminData } = await supabase
          .from('admins')
          .select('email')
          .eq('email', session.user.email)
          .maybeSingle();

        if (adminData) {
          console.log('Admin detected on main site - auto logout');
          await supabase.auth.signOut();
          setIsAuthenticated(false);
          setUserEmail(null);
          router.refresh();
        }
      }
    };

    checkAndLogoutAdmin();
  }, [pathname, router]);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
    setUserEmail(session?.user?.email || null);
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
    { label: 'PORTFOLIO', href: '/portfolio' },
    { label: 'LOCATION LIBRARY', href: '/location-library' },
    { label: 'ABOUT US', href: '/about' },
    { label: 'CONTACT', href: '/contact' },
    { label: 'LIST YOUR PROPERTY', href: '/list-your-property' },
    { label: 'ARTICLES', href: '/articles' },
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
                className={`w-[350px] ${isHomepage ? 'bg-white/90 text-gray-900' : 'bg-white'}`}
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
                  className="text-white text-sm tracking-widest hover:text-[#e11921] transition-colors" style={{fontWeight: 300}}
                >
                  {item.label}
                </button>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-white text-sm tracking-widest hover:text-[#e11921] transition-colors" style={{fontWeight: 300}}
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
