'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { X, Camera } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '', form: '' });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

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

    setTimeout(() => {
      onClose();
      router.push('/dashboard');
      setLoading(false);
    }, 500);
  };

  return (
    <>
      <style jsx global>{`
        .login-modal-input {
          appearance: auto;
          background-clip: padding-box;
          background-color: rgb(255, 255, 255) !important;
          border: 1px solid rgb(206, 212, 218) !important;
          border-radius: 0px !important;
          box-shadow: rgba(0, 0, 0, 0.13) 0px 2px 4px 0px !important;
          box-sizing: border-box;
          color: rgb(73, 80, 87) !important;
          display: block;
          font-family: acumin-pro-wide, sans-serif !important;
          font-size: 16px !important;
          font-weight: 300 !important;
          height: 38px !important;
          line-height: 24px !important;
          padding: 6px 12px !important;
          text-align: start;
          transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
          width: 100%;
          -webkit-font-smoothing: antialiased;
          -webkit-text-fill-color: rgb(73, 80, 87) !important;
        }

        .login-modal-input:focus {
          border-color: rgb(134, 183, 254) !important;
          box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25) !important;
          outline: 0 !important;
        }

        .login-modal-input::placeholder {
          color: #6c757d !important;
          opacity: 0.7 !important;
        }

        .login-modal-input::-webkit-input-placeholder {
          color: #6c757d !important;
          opacity: 0.7 !important;
        }

        .login-modal-input::-moz-placeholder {
          color: #6c757d !important;
          opacity: 0.7 !important;
        }

        .login-modal-input:-ms-input-placeholder {
          color: #6c757d !important;
          opacity: 0.7 !important;
        }

        .login-modal-input::-ms-input-placeholder {
          color: #6c757d !important;
          opacity: 0.7 !important;
        }

        .login-modal-input.error {
          border-color: rgb(234, 154, 158) !important;
        }

        .login-checkbox {
          width: 16px;
          height: 16px;
          margin-right: 8px;
          cursor: pointer;
        }
      `}</style>

      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-lg shadow-xl max-w-md w-full p-8 relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-2">
              <Camera className="w-8 h-8 text-[#e11921]" />
              <span className="text-xl font-bold tracking-tight" style={{ color: 'rgb(73, 80, 87)' }}>
                SGS LOCATIONS<sup className="text-xs">®</sup>
              </span>
            </div>
          </div>

          <p className="text-center mb-6" style={{ color: 'rgb(73, 80, 87)', fontSize: '15px' }}>
            To download images, please login
            <br />
            or create an account{' '}
            <Link
              href="/register"
              onClick={onClose}
              className="hover:underline"
              style={{ color: '#e11921' }}
            >
              here
            </Link>
          </p>

          {errors.form && (
            <div className="mb-4 p-3 rounded" style={{
              backgroundColor: '#f8d7da',
              border: '1px solid #f5c2c7',
              color: '#842029'
            }}>
              {errors.form}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block mb-1 text-sm font-medium"
                style={{ color: 'rgb(73, 80, 87)' }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`login-modal-input ${errors.email ? 'error' : ''}`}
                placeholder="your@email.com"
              />
              {errors.email && (
                <p className="text-sm mt-1" style={{ color: '#dc3545' }}>
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block mb-1 text-sm font-medium"
                style={{ color: 'rgb(73, 80, 87)' }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`login-modal-input ${errors.password ? 'error' : ''}`}
                placeholder="Enter your password"
              />
              {errors.password && (
                <p className="text-sm mt-1" style={{ color: '#dc3545' }}>
                  {errors.password}
                </p>
              )}
            </div>

            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="login-checkbox"
              />
              <label
                htmlFor="remember"
                className="text-sm cursor-pointer select-none"
                style={{ color: 'rgb(73, 80, 87)' }}
              >
                Remember me
              </label>
            </div>

            <div className="text-right">
              <Link
                href="/forgot-password"
                onClick={onClose}
                className="text-sm hover:underline"
                style={{ color: '#6c757d' }}
              >
                Forgot your password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full font-semibold py-2 px-8 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: '#e11921',
                color: 'white',
                border: 'none',
                fontSize: '16px',
                height: '42px'
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.backgroundColor = '#c41e26';
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.backgroundColor = '#e11921';
              }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
