'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

/**
 * SessionMonitor - Monitors Supabase auth state and handles session expiration
 *
 * This component:
 * 1. Listens for auth state changes
 * 2. Detects when session expires
 * 3. Redirects to login for protected pages
 * 4. Refreshes the page when session is restored
 */
export function SessionMonitor() {
  const router = useRouter();
  const pathname = usePathname();
  const lastSessionRef = useRef<string | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      lastSessionRef.current = session?.access_token || null;
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentToken = session?.access_token || null;
        const hadSession = lastSessionRef.current !== null;
        const hasSession = currentToken !== null;

        console.log('🔐 Auth state changed:', event, {
          hadSession,
          hasSession,
          pathname
        });

        // Session expired or signed out
        if (hadSession && !hasSession) {
          console.warn('⚠️ Session expired or user signed out');

          // If on a protected page, redirect to appropriate login
          if (pathname?.startsWith('/admin')) {
            console.log('Redirecting to admin login...');
            router.push('/admin/login');
          } else if (pathname?.startsWith('/dashboard') ||
                     pathname?.startsWith('/edit-property') ||
                     pathname?.startsWith('/list-your-property')) {
            console.log('Redirecting to user login...');
            router.push('/register');
          }
        }

        // Session restored (e.g., after token refresh)
        if (!hadSession && hasSession && event === 'SIGNED_IN') {
          console.log('✅ Session restored, refreshing page...');
          router.refresh();
        }

        // Token refreshed
        if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 Token refreshed successfully');
        }

        // Update last session reference
        lastSessionRef.current = currentToken;
      }
    );

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [router, pathname]);

  // This component doesn't render anything
  return null;
}
