'use client';

import { useState } from 'react';
import { X, Camera } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({ email: '', password: '' });

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setErrors({
        email: !email ? 'Email is required' : '',
        password: !password ? 'Password is required' : ''
      });
      return;
    }

    window.location.replace('/dashboard');
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2">
            <Camera className="w-8 h-8 text-red-600" />
            <span className="text-xl font-bold tracking-tight text-gray-900">
              SGS LOCATIONS<sup className="text-xs">®</sup>
            </span>
          </div>
        </div>

        <p className="text-center text-gray-700 mb-6">
          To download images, please login<br />
          or create an account{' '}
          <a href="/register" className="text-red-600 hover:text-red-700 font-medium">
            here
          </a>
        </p>

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-1 text-sm">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors({ ...errors, email: '' });
              }}
              className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
              placeholder="your@email.com"
            />
            {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-1 text-sm">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors({ ...errors, password: '' });
              }}
              className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
              placeholder="Enter your password"
            />
            {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password}</p>}
          </div>

          <div className="mb-4 flex items-center">
            <input type="checkbox" className="w-4 h-4 mr-2" />
            <label className="text-sm text-gray-700">Remember me</label>
          </div>

          <div className="mb-4 text-right">
            <a href="/forgot-password" className="text-sm text-red-600 hover:text-red-700">
              Forgot your password?
            </a>
          </div>

          <button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
