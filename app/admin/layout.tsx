'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Chrome as Home, Building2, Users, Mail, Settings, LogOut, Menu, X, FileText, Folder } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      router.push('/admin/login');
      return;
    }

    const { data: userData } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', session.user.id)
      .single();

    if (!userData?.is_admin) {
      router.push('/');
      return;
    }

    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    localStorage.removeItem('adminAuth');
    router.push('/admin/login');
  }

  const menuItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: Home },
    { href: '/admin/properties', label: 'Properties', icon: Building2 },
    { href: '/admin/categories', label: 'Categories', icon: Folder },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/inquiries', label: 'Inquiries', icon: Mail },
    { href: '/admin/content', label: 'Content', icon: FileText },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

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
            <h1 className="text-xl font-bold text-red-600">SGS Locations Admin</h1>
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
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-red-50 text-red-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
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
