'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Camera } from 'lucide-react';
import LoginModal from '@/components/LoginModal';
import { nunito } from '@/lib/fonts';

export default function RegisterPage() {
  const router = useRouter();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    form: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    const newErrors = {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      form: '',
    };
    let isValid = true;

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
      isValid = false;
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
      isValid = false;
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
      isValid = false;
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    setTimeout(() => {
      router.push('/dashboard');
      setLoading(false);
    }, 500);
  };

  return (
    <>
      <style jsx global>{`
        .register-page input[type="text"],
        .register-page input[type="email"],
        .register-page input[type="password"] {
          border-radius: 0 !important;
          padding: 0.5rem 0.75rem;
          border: 1px solid #d1d5db;
        }

        .register-page input[type="text"]:focus,
        .register-page input[type="email"]:focus,
        .register-page input[type="password"]:focus {
          border-color: #f2888c !important;
          box-shadow: 0 0 0 0 rgba(225, 25, 33, 0.25) !important;
          outline: none !important;
          --tw-ring-shadow: none !important;
        }

        .register-page button[type="submit"] {
          background-color: #e11921;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
          font-size: 0.75rem;
        }

        .register-page button[type="submit"]:hover {
          background-color: #bf151c;
        }

        .register-page button[type="submit"]:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>

      <main className={`register-page min-h-screen bg-gray-100 flex items-center sm:justify-center pt-6 sm:pt-0 px-4 ${nunito.className}`}>
        <div className="w-full max-w-sm sm:max-w-md">
          <div className="flex justify-center mb-6">
            <Link href="/" className="block w-full" style={{ maxWidth: '500px' }}>
              <div className="flex items-center justify-center gap-2">
                <Camera className="w-10 h-10 text-[#e11921]" />
                <span className="text-2xl font-bold tracking-tight text-gray-900">
                  SGS LOCATIONS<sup className="text-xs">®</sup>
                </span>
              </div>
            </Link>
          </div>

          <div className="bg-white shadow-md sm:rounded-lg p-8">
            {errors.form && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                {errors.form}
              </div>
            )}

            <form onSubmit={handleRegister}>
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  autoFocus
                  required
                  className="w-full"
                  placeholder="John"
                />
                {errors.firstName && (
                  <p className="text-red-600 text-sm mt-1">{errors.firstName}</p>
                )}
              </div>

              <div className="mt-4">
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="w-full"
                  placeholder="Doe"
                />
                {errors.lastName && (
                  <p className="text-red-600 text-sm mt-1">{errors.lastName}</p>
                )}
              </div>

              <div className="mt-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full"
                  placeholder="your@email.com"
                />
                {errors.email && (
                  <p className="text-red-600 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              <div className="mt-4">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                  className="w-full"
                  placeholder="Minimum 8 characters"
                />
                {errors.password && (
                  <p className="text-red-600 text-sm mt-1">{errors.password}</p>
                )}
              </div>

              <div className="mt-4">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full"
                  placeholder="Re-enter your password"
                />
                {errors.confirmPassword && (
                  <p className="text-red-600 text-sm mt-1">{errors.confirmPassword}</p>
                )}
              </div>

              <div className="mt-5 mb-5">
                <div className="border border-gray-300 bg-gray-50 p-4 mx-auto" style={{ maxWidth: '304px' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        className="w-6 h-6 accent-red-600 cursor-pointer"
                        required
                      />
                      <span className="text-sm text-gray-700">I'm not a robot</span>
                    </div>
                    <div className="text-right">
                      <div className="flex flex-col items-end">
                        <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" fill="#4285F4"/>
                          <path d="M8 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <p className="text-xs text-gray-500 mt-1">
                          reCAPTCHA
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setIsLoginModalOpen(true)}
                  className="text-sm text-gray-600 hover:text-gray-900 underline"
                >
                  Already registered?
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="text-white"
                >
                  {loading ? 'Creating...' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      </main>
    </>
  );
}
