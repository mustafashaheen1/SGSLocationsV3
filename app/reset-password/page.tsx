'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    let subscription: any;
    let timeoutId: any;

    // Log URL hash for debugging
    if (typeof window !== 'undefined') {
      console.log('Current URL hash:', window.location.hash);
      console.log('Current URL search:', window.location.search);
    }

    // Handle auth state changes and token exchange
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, 'User ID:', session?.user?.id);

      if (event === 'PASSWORD_RECOVERY') {
        console.log('✅ PASSWORD_RECOVERY event detected');
        setIsValidSession(true);
        // Clear any pending timeout
        if (timeoutId) clearTimeout(timeoutId);
      } else if (event === 'SIGNED_IN' && session) {
        console.log('✅ SIGNED_IN event detected');
        setIsValidSession(true);
        // Clear any pending timeout
        if (timeoutId) clearTimeout(timeoutId);
      } else if (event === 'INITIAL_SESSION' && session) {
        console.log('✅ INITIAL_SESSION with valid session detected');
        setIsValidSession(true);
        // Clear any pending timeout
        if (timeoutId) clearTimeout(timeoutId);
      }
    });

    subscription = authSubscription;

    // Check for existing session
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log('Current session check - User ID:', session?.user?.id, 'Error:', error);

      if (session) {
        console.log('✅ Valid session found immediately');
        setIsValidSession(true);
      } else {
        // Wait for token exchange to complete
        console.log('⏳ No session found, waiting for token exchange...');
        timeoutId = setTimeout(async () => {
          const { data: { session: retrySession }, error: retryError } = await supabase.auth.getSession();
          console.log('Retry session check - User ID:', retrySession?.user?.id, 'Error:', retryError);

          if (retrySession) {
            console.log('✅ Valid session found after retry');
            setIsValidSession(true);
          } else {
            console.log('❌ No valid session found');
            toast({
              title: 'Invalid or expired link',
              description: 'Please request a new password reset link.',
              variant: 'destructive'
            });
            setTimeout(() => router.push('/forgot-password'), 3000);
          }
        }, 2000);
      }
    };

    checkSession();

    return () => {
      subscription?.unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [router, toast]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure both passwords are the same.',
        variant: 'destructive'
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 6 characters long.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        console.error('Password reset error:', error);
        toast({
          title: 'Failed to reset password',
          description: error.message,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Password reset successful!',
          description: 'Your password has been updated. Redirecting to login...'
        });

        // Sign out and redirect to login
        await supabase.auth.signOut();
        setTimeout(() => router.push('/admin/login'), 2000);
      }
    } catch (error: any) {
      console.error('Unexpected error:', error);
      toast({
        title: 'An error occurred',
        description: 'Please try again or contact support.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-brand rounded flex items-center justify-center">
              <span className="text-white font-bold text-2xl">S</span>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your new password below
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1"
                placeholder="Enter new password"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <Input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1"
                placeholder="Confirm new password"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <Button
              type="submit"
              className="w-full bg-brand hover:bg-brand-hover"
              disabled={isLoading}
            >
              {isLoading ? 'Resetting password...' : 'Reset password'}
            </Button>
          </div>
        </form>

        <div className="text-center">
          <a
            href="/admin/login"
            className="text-sm text-brand hover:text-red-500"
          >
            Back to login
          </a>
        </div>
      </div>
    </div>
  );
}
