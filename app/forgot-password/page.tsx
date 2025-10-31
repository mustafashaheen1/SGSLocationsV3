'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Camera } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({ email: '', form: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validateForm = () => {
    const newErrors = { email: '', form: '' };
    let isValid = true;

    if (!email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({ email: '', form: '' });

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setErrors({ email: '', form: error.message });
    } else {
      setSuccess(true);
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-white flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-6">
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-2 mb-8">
            <Camera className="w-10 h-10 text-red-600" />
            <span className="text-2xl font-bold tracking-tight text-gray-900">
              SGS LOCATIONS<sup className="text-xs">®</sup>
            </span>
          </Link>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Reset Password</h1>

          {success ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded text-green-700">
                We've sent you an email with a password reset link. Please check your inbox
                and follow the instructions to reset your password.
              </div>
              <Link
                href="/login"
                className="block text-center text-red-600 hover:text-red-700 font-medium"
              >
                Back to Login
              </Link>
            </div>
          ) : (
            <>
              <p className="text-gray-700 mb-6 text-sm leading-relaxed">
                Forgot your password? No problem. Just let us know your email address and we
                will email you a password reset link that will allow you to choose a new one.
              </p>

              {errors.form && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                  {errors.form}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-gray-700 mb-1 text-sm">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none"
                    placeholder="your@email.com"
                  />
                  {errors.email && (
                    <p className="text-red-600 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase"
                >
                  {loading ? 'Sending...' : 'Email Password Reset Link'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Back to Login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
