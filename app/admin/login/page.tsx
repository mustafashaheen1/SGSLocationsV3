'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        console.log('Checking admin authentication...');

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session check error:', sessionError);
          if (mounted) setIsCheckingAuth(false);
          return;
        }

        if (session?.user) {
          console.log('User session found:', session.user.email);

          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('is_admin')
            .eq('id', session.user.id)
            .single();

          if (userError) {
            console.error('User check error:', userError);
            if (mounted) setIsCheckingAuth(false);
            return;
          }

          if (userData?.is_admin) {
            console.log('Admin verified, redirecting to dashboard...');
            router.push('/admin/dashboard');
            return;
          } else {
            console.log('User is not an admin');
          }
        }

        if (mounted) {
          setIsCheckingAuth(false);
        }
      } catch (err) {
        console.error('Auth check error:', err);
        if (mounted) {
          setIsCheckingAuth(false);
          setError('Failed to check authentication. Please try again.');
        }
      }
    };

    const timeout = setTimeout(() => {
      if (mounted && isCheckingAuth) {
        console.log('Auth check timeout, showing login form');
        setIsCheckingAuth(false);
        setError('Connection timeout. Please check your internet and try again.');
      }
    }, 5000);

    checkAuth();

    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, [router, isCheckingAuth]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('Attempting admin login...');

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error('Auth error:', authError);
        setError(authError.message || 'Invalid email or password');
        setIsLoading(false);
        return;
      }

      if (!authData.user) {
        setError('Authentication failed. Please try again.');
        setIsLoading(false);
        return;
      }

      console.log('Auth successful, checking admin status...');

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', authData.user.id)
        .single();

      if (userError) {
        console.error('User check error:', userError);
        await supabase.auth.signOut();
        setError('Failed to verify admin status. Please contact support.');
        setIsLoading(false);
        return;
      }

      if (!userData?.is_admin) {
        console.log('User is not an admin');
        await supabase.auth.signOut();
        setError('Access denied. Admin privileges required.');
        setIsLoading(false);
        return;
      }

      console.log('Admin verified, redirecting...');
      router.push('/admin/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e11921] mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
          <p className="text-xs text-gray-400 mt-2">If this takes too long, please refresh the page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900" style={{ fontFamily: 'acumin-pro-wide' }}>
            Admin Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            SGS Locations Administration Panel
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-[#e11921] focus:border-[#e11921] focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-[#e11921] focus:border-[#e11921] focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#e11921] hover:bg-[#c41519] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#e11921] disabled:opacity-50 disabled:cursor-not-allowed"
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
                'Sign in'
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              For admin access issues, contact support
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
