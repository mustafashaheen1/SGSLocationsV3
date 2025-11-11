'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();
  const hasChecked = useRef(false);

  useEffect(() => {
    // Prevent multiple executions
    if (hasChecked.current) return;
    hasChecked.current = true;

    let isMounted = true;

    const checkAuth = async () => {
      try {
        console.log('[Admin Login] Starting auth check...');
        const supabase = createClient();

        // Force timeout after 3 seconds
        const timeoutId = setTimeout(() => {
          if (isMounted) {
            console.log('[Admin Login] TIMEOUT - showing login form');
            setIsCheckingAuth(false);
          }
        }, 3000);

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        clearTimeout(timeoutId);

        if (sessionError || !session) {
          console.log('[Admin Login] No session found');
          if (isMounted) setIsCheckingAuth(false);
          return;
        }

        console.log('[Admin Login] Session found, checking admin status...');

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('is_admin')
          .eq('id', session.user.id)
          .maybeSingle();

        if (userError || !userData?.is_admin) {
          console.log('[Admin Login] Not admin or error');
          if (isMounted) setIsCheckingAuth(false);
          return;
        }

        console.log('[Admin Login] Admin verified, redirecting...');
        router.push('/admin/dashboard');
        router.refresh();
      } catch (err) {
        console.error('[Admin Login] Error:', err);
        if (isMounted) setIsCheckingAuth(false);
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('[Admin Login] Attempting login...');
      const supabase = createClient();

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (authError) {
        console.error('[Admin Login] Auth error:', authError);
        setError(authError.message);
        setIsLoading(false);
        return;
      }

      if (!authData.user) {
        setError('Login failed');
        setIsLoading(false);
        return;
      }

      console.log('[Admin Login] Checking admin status...');

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (userError || !userData?.is_admin) {
        console.log('[Admin Login] Not admin');
        await supabase.auth.signOut();
        setError('Access denied. Admin privileges required.');
        setIsLoading(false);
        return;
      }

      console.log('[Admin Login] Success! Redirecting...');
      router.push('/admin/dashboard');
      router.refresh();
    } catch (err) {
      console.error('[Admin Login] Exception:', err);
      setError('An error occurred');
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e11921] mx-auto mb-4"></div>
          <p className="text-gray-600" style={{ fontFamily: 'acumin-pro-wide' }}>
            Checking authentication...
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Max wait: 3 seconds
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2
            className="mt-6 text-center text-3xl font-bold text-gray-900"
            style={{ fontFamily: 'acumin-pro-wide' }}
          >
            Admin Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            SGS Locations Administration Panel
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="rounded-md bg-red-50 p-4 border border-red-200">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-[#e11921] focus:border-[#e11921] sm:text-sm"
                placeholder="admin@sgslocations.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-[#e11921] focus:border-[#e11921] sm:text-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium text-white bg-[#e11921] hover:bg-[#c41519] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#e11921] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ fontFamily: 'acumin-pro-wide' }}
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
