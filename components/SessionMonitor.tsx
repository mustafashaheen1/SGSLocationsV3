'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase';

/**
 * SessionMonitor - Monitors Supabase auth state and handles session expiration
 *
 * This component:
 * 1. Listens for auth state changes
 * 2. Detects when session expires
 * 3. Redirects to login for protected pages
 * 4. Refreshes the page when session is restored
 * 5. Proactively refreshes sessions before expiry
 */
export function SessionMonitor() {
  const router = useRouter();
  const pathname = usePathname();
  const lastSessionRef = useRef<string | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const supabase = createClient();

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

          if (pathname?.startsWith('/admin')) {
            router.push('/admin/login');
          } else if (pathname?.startsWith('/dashboard') ||
                     pathname?.startsWith('/edit-property') ||
                     pathname?.startsWith('/list-your-property')) {
            router.push('/register');
          }
        }

        // Session restored
        if (!hadSession && hasSession && event === 'SIGNED_IN') {
          console.log('✅ Session restored, refreshing page...');
          router.refresh();
        }

        // Token refreshed
        if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 Token refreshed successfully');
        }

        lastSessionRef.current = currentToken;
      }
    );

    // ✅ NEW: Periodic session check (every 30 seconds)
    checkIntervalRef.current = setInterval(async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Session check error:', error);
          return;
        }

        if (session) {
          // Check if session is about to expire (within 5 minutes)
          const expiresAt = session.expires_at;
          if (expiresAt) {
            const expiryTime = expiresAt * 1000;
            const now = Date.now();
            const fiveMinutes = 5 * 60 * 1000;

            if (expiryTime - now < fiveMinutes) {
              console.log('🔄 Session expiring soon, refreshing...');
              await supabase.auth.refreshSession();
            }
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
      }
    }, 30000); // Check every 30 seconds

    return () => {
      subscription.unsubscribe();
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [router, pathname]);

  return null;
}
