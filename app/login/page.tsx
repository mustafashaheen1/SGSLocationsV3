'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Camera } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '', form: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        router.push('/dashboard');
      }
    }

    checkSession();
  }, [router]);

  const validateForm = () => {
    const newErrors = { email: '', password: '', form: '' };
    let isValid = true;

    if (!email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
      isValid = false;
    }

    if (!password) {
      newErrors.password = 'Password is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({ email: '', password: '', form: '' });

    try {
      console.log('═══════════════════════════════════════');
      console.log('🔐 LOGIN ATTEMPT STARTED');
      console.log('Email:', email);
      console.log('Password length:', password.length);
      console.log('═══════════════════════════════════════');

      // Check if supabase is initialized
      console.log('Supabase client exists:', !!supabase);

      // Sign out first
      console.log('🚪 Signing out existing session...');
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        console.error('Sign out error:', signOutError);
      } else {
        console.log('✅ Signed out successfully');
      }

      // Attempt login
      console.log('🚀 Attempting signInWithPassword...');
      const loginResult = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('═══════════════════════════════════════');
      console.log('📊 SUPABASE LOGIN RESULT:');
      console.log('Full response:', JSON.stringify(loginResult, null, 2));
      console.log('═══════════════════════════════════════');
      console.log('Error object:', loginResult.error);
      console.log('Error message:', loginResult.error?.message);
      console.log('Data exists:', !!loginResult.data);
      console.log('User exists:', !!loginResult.data?.user);
      console.log('User email:', loginResult.data?.user?.email);
      console.log('Session exists:', !!loginResult.data?.session);
      console.log('═══════════════════════════════════════');

      const { data, error } = loginResult;

      if (error) {
        console.error('❌ Authentication failed with error:', error.message);
        throw error;
      }

      if (!data.user) {
        console.error('❌ No user in response');
        throw new Error('Login failed - no user returned');
      }

      if (!data.session) {
        console.error('❌ No session in response');
        throw new Error('Login failed - no session created');
      }

      console.log('✅ LOGIN SUCCESSFUL - Redirecting to dashboard...');
      router.push('/dashboard');

    } catch (err: any) {
      console.error('═══════════════════════════════════════');
      console.error('💥 LOGIN ERROR CAUGHT:');
      console.error('Error type:', err.constructor.name);
      console.error('Error message:', err.message);
      console.error('Error object:', err);
      console.error('═══════════════════════════════════════');

      setErrors({
        email: '',
        password: '',
        form: err.message || 'Invalid email or password'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <Camera className="w-10 h-10 text-[#e11921]" />
            <span className="text-2xl font-bold text-gray-900">
              SGS LOCATIONS<sup className="text-xs">®</sup>
            </span>
          </Link>
        </div>

        <div className="bg-white shadow rounded-lg p-8">
          <div className="text-center mb-6">
            <p className="text-gray-600">
              To access your account, please login or{' '}
              <Link href="/register" className="text-[#e11921] hover:underline">
                create an account
              </Link>
            </p>
          </div>

          {errors.form && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
              {errors.form}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-gray-700 mb-1 text-sm">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none"
                placeholder="your@email.com"
                style={{ color: '#495057' }}
              />
              {errors.email && (
                <p className="text-red-600 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-gray-700 mb-1 text-sm">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none"
                placeholder="Enter your password"
                style={{ color: '#495057' }}
              />
              {errors.password && (
                <p className="text-red-600 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <label htmlFor="remember" className="ml-2 text-sm text-gray-700">
                  Remember me
                </label>
              </div>
              <Link
                href="/forgot-password"
                className="text-sm text-[#e11921] hover:text-red-700 font-medium"
              >
                Forgot your password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#e11921] hover:bg-[#c41e26] text-white font-semibold py-2 px-8 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-700">
            Don't have an account?{' '}
            <Link href="/register" className="text-[#e11921] hover:text-red-700 font-medium">
              Register here
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
