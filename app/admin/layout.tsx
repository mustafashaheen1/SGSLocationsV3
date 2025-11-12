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
  Folder
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

    const checkAuth = async () => {
      try {
        console.log('[Admin Layout] Checking auth...');
        const supabase = createClient();

        // Timeout after 3 seconds
        const timeoutId = setTimeout(() => {
          console.log('[Admin Layout] Auth check timeout');
          router.push('/admin/login');
        }, 3000);

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        clearTimeout(timeoutId);

        if (sessionError || !session) {
          console.log('[Admin Layout] No session');
          router.push('/admin/login');
          return;
        }

        const { data: adminData, error: adminError } = await supabase
          .from('admins')
          .select('id, email, role')
          .eq('email', session.user.email)
          .maybeSingle();

        if (adminError || !adminData) {
          console.log('[Admin Layout] Not found in admins table');
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

    checkAuth();
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

  const menuItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: Home },
    {
      label: 'Properties',
      icon: Building2,
      subItems: [
        { href: '/admin/properties', label: 'All Properties' },
        { href: '/admin/properties/pending', label: 'Pending Approval' },
        { href: '/admin/properties/approved', label: 'Approved' },
        { href: '/admin/properties/admin', label: 'Admin Properties' },
      ]
    },
    { href: '/admin/categories', label: 'Categories', icon: Folder },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/inquiries', label: 'Inquiries', icon: Mail },
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#e11921] mx-auto"></div>
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
            <h1 className="text-xl font-bold text-[#e11921]" style={{ fontFamily: 'acumin-pro-wide' }}>
              SGS Locations Admin
            </h1>
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
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            if ('subItems' in item && item.subItems) {
              const Icon = item.icon;

              return (
                <div key={item.label}>
                  <div className="flex items-center gap-3 px-4 py-3 text-gray-700 font-medium" style={{ fontFamily: 'acumin-pro-wide' }}>
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </div>
                  <div className="ml-6 space-y-1">
                    {item.subItems.map((subItem) => (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        className={`block px-4 py-2 rounded-lg text-sm transition-colors ${
                          pathname === subItem.href
                            ? 'bg-red-50 text-[#e11921] font-medium'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                        style={{ fontFamily: 'acumin-pro-wide' }}
                      >
                        {subItem.label}
                      </Link>
                    ))}
                  </div>
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
                      ? 'bg-red-50 text-[#e11921] font-medium'
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
