'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Camera } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { nunito } from '@/lib/fonts';

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
    <>
      <style jsx global>{`
        .forgot-password-page input[type="email"] {
          border-radius: 0 !important;
          padding: 0.5rem 0.75rem;
          border: 1px solid #d1d5db;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }

        .forgot-password-page input[type="email"]:focus {
          border-color: #f2888c !important;
          box-shadow: 0 0 0 0 rgba(225, 25, 33, 0.25) !important;
          outline: none !important;
          --tw-ring-shadow: none !important;
        }

        .forgot-password-page button[type="submit"] {
          background-color: #e11921;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
          font-size: 0.75rem;
        }

        .forgot-password-page button[type="submit"]:hover {
          background-color: #bf151c;
        }

        .forgot-password-page button[type="submit"]:disabled {
          opacity: 0.25;
          cursor: not-allowed;
        }
      `}</style>

      <div className={`forgot-password-page font-sans text-gray-900 antialiased ${nunito.className}`}>
        <div className="min-h-screen flex flex-col sm:justify-center items-center pt-6 sm:pt-0 bg-gray-100">
          <Link href="/" className="w-full" style={{ maxWidth: '500px' }}>
            <div className="flex items-center justify-center gap-2">
              <Camera className="w-10 h-10 text-[#e11921]" />
              <span className="text-2xl font-bold tracking-tight text-gray-900">
                SGS LOCATIONS<sup className="text-xs">®</sup>
              </span>
            </div>
          </Link>

          <div className="w-full sm:max-w-sm mt-6 px-8 py-8 bg-white shadow-md overflow-hidden sm:rounded-lg">
            {success ? (
              <div className="space-y-4">
                <div className="mb-4 text-sm text-gray-600">
                  We've sent you an email with a password reset link. Please check your inbox
                  and follow the instructions to reset your password.
                </div>
                <div className="flex items-center justify-end mt-4">
                  <Link
                    href="/"
                    className="inline-flex items-center px-4 py-2 bg-[#e11921] border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-[#bf151c] transition ease-in-out duration-150"
                  >
                    Back to Home
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-4 text-sm text-gray-600">
                  Forgot your password? No problem. Just let us know your email address and we
                  will email you a password reset link that will allow you to choose a new one.
                </div>

                {errors.form && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                    {errors.form}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div>
                    <label htmlFor="email" className="block font-medium text-sm text-gray-700">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block mt-1 w-full"
                      required
                      autoFocus
                    />
                    {errors.email && (
                      <p className="text-red-600 text-sm mt-1">{errors.email}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-end mt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center text-white border border-transparent transition ease-in-out duration-150"
                    >
                      {loading ? 'Sending...' : 'Email Password Reset Link'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
