'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Home,
  Building2,
  Users,
  Mail,
  Settings,
  LogOut,
  Menu,
  FileText,
  Folder,
  Filter,
  FolderOpen,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { createClient } from '@/lib/supabase';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set());
  const [siteLogo, setSiteLogo] = useState<string>('');
  const hasCheckedAuth = useRef(false);

  useEffect(() => {
    // Skip auth check on login page
    if (pathname === '/admin/login') {
      setLoading(false);
      return;
    }

    // Prevent duplicate checks
    if (hasCheckedAuth.current) return;
    hasCheckedAuth.current = true;

    const supabase = createClient();

    const fetchSiteLogo = async () => {
      try {
        console.log('[Admin Layout] Fetching site logo...');
        const { data, error } = await (supabase
          .from('app_settings') as any)
          .select('setting_value')
          .eq('setting_key', 'site_logo_url')
          .maybeSingle();

        if (error) {
          console.error('[Admin Layout] Error fetching site logo:', error);
          return;
        }

        if (data && data.setting_value) {
          console.log('[Admin Layout] Logo URL fetched:', data.setting_value);
          setSiteLogo(data.setting_value);
        } else {
          console.log('[Admin Layout] No logo URL found in database');
        }
      } catch (error) {
        console.error('[Admin Layout] Exception fetching site logo:', error);
      }
    };

    const checkAuth = async () => {
      try {
        console.log('[Admin Layout] Checking auth...');

        // Timeout after 3 seconds
        const timeoutId = setTimeout(() => {
          console.log('[Admin Layout] Auth check timeout');
          router.push('/admin/login');
        }, 3000);

        // Refresh session on mount
        const { data: { session }, error: sessionError } = await supabase.auth.refreshSession();

        clearTimeout(timeoutId);

        if (sessionError || !session) {
          console.log('[Admin Layout] Session expired');
          router.push('/admin/login');
          return;
        }

        // Check admin status
        if (!session.user.email) {
          console.log('[Admin Layout] No email found in session');
          await supabase.auth.signOut();
          router.push('/admin/login');
          return;
        }

        const { directFetch } = await import('@/lib/supabase');
        const { data: adminData, error: adminError } = await directFetch('admins', {
          select: 'id,email,role',
          eq: { email: session.user.email || '' },
          single: true,
          authToken: session.access_token
        });

        if (adminError || !adminData) {
          console.log('[Admin Layout] Not an admin');
          await supabase.auth.signOut();
          router.push('/admin/login');
          return;
        }

        console.log('[Admin Layout] Auth valid');
        setLoading(false);
      } catch (err) {
        console.error('[Admin Layout] Error:', err);
        router.push('/admin/login');
      }
    };

    fetchSiteLogo();
    checkAuth();

    // Set up automatic session refresh every 5 minutes
    const refreshInterval = setInterval(async () => {
      console.log('🔄 Auto-refreshing session...');
      const { data: { session }, error } = await supabase.auth.refreshSession();

      if (error || !session) {
        console.error('❌ Session refresh failed:', error);
        clearInterval(refreshInterval);
        router.push('/admin/login');
      } else {
        console.log('✅ Session refreshed successfully');
      }
    }, 5 * 60 * 1000); // Refresh every 5 minutes

    // Cleanup interval on unmount
    return () => {
      clearInterval(refreshInterval);
    };
  }, [pathname, router]);

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/admin/login');
    } catch (err) {
      console.error('Logout error:', err);
      router.push('/admin/login');
    }
  };

  const toggleDropdown = (label: string) => {
    setOpenDropdowns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(label)) {
        newSet.delete(label);
      } else {
        newSet.add(label);
      }
      return newSet;
    });
  };

  const menuItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: Home },
    {
      label: 'Properties',
      icon: Building2,
      subItems: [
        { href: '/admin/properties', label: 'All Properties' },
        { href: '/admin/properties/pending', label: 'Pending Approval' },
        { href: '/admin/properties/approved', label: 'Approved' },
        { href: '/admin/properties/featured', label: 'Featured Properties' },
        { href: '/admin/properties/exclusive', label: 'Exclusive Properties' },
        { href: '/admin/properties/admin', label: 'Admin Properties' },
      ]
    },
    { href: '/admin/categories', label: 'Categories', icon: Folder },
    { href: '/admin/search-filters', label: 'Search Filters', icon: Filter },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/inquiries', label: 'Inquiries', icon: Mail },
    { href: '/admin/documents', label: 'Documents', icon: FolderOpen },
    { href: '/admin/content', label: 'Content', icon: FileText },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  // Don't show admin layout on login page
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  // Show admin layout
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3">
              {siteLogo && (
                <img
                  src={siteLogo}
                  alt="SGS Locations"
                  className="h-8 w-auto object-contain"
                  onLoad={() => {
                    console.log('[Admin Layout] Logo image loaded successfully');
                  }}
                  onError={(e) => {
                    console.error('[Admin Layout] Logo image failed to load:', siteLogo);
                    e.currentTarget.style.display = 'none';
                    setSiteLogo('');
                  }}
                />
              )}
              <h1 className="text-xl font-bold text-brand" style={{ fontFamily: 'geometric sans-serif' }}>
                SGS Locations Admin
              </h1>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </header>

      <aside
        className={`fixed top-14 left-0 bottom-0 w-64 bg-white border-r border-gray-200 transition-transform duration-300 z-30 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="p-4 space-y-1 overflow-y-auto h-full">
          {menuItems.map((item) => {
            if ('subItems' in item && item.subItems) {
              const Icon = item.icon;
              const isOpen = openDropdowns.has(item.label);
              const ChevronIcon = isOpen ? ChevronDown : ChevronRight;

              return (
                <div key={item.label}>
                  <button
                    onClick={() => toggleDropdown(item.label)}
                    className="flex items-center justify-between w-full px-4 py-3 text-gray-700 font-medium hover:bg-gray-50 rounded-lg transition-colors"
                    style={{ fontFamily: 'acumin-pro-wide' }}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </div>
                    <ChevronIcon className="w-4 h-4" />
                  </button>
                  {isOpen && (
                    <div className="ml-6 space-y-1 mt-1">
                      {item.subItems.map((subItem) => (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={`block px-4 py-2 rounded-lg text-sm transition-colors ${
                            pathname === subItem.href
                              ? 'bg-red-50 text-brand font-medium'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                          style={{ fontFamily: 'acumin-pro-wide' }}
                        >
                          {subItem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            } else {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-red-50 text-brand font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  style={{ fontFamily: 'acumin-pro-wide' }}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            }
          })}
        </nav>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main
        className={`pt-14 transition-all duration-300 ${
          sidebarOpen ? 'lg:pl-64' : ''
        }`}
      >
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
