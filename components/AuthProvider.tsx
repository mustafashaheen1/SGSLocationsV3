'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface AuthState {
  isAuthenticated: boolean;
  userEmail: string | null;
  userType: string | null;
}

const AuthContext = createContext<AuthState>({
  isAuthenticated: false,
  userEmail: null,
  userType: null,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    userEmail: null,
    userType: null,
  });

  useEffect(() => {
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { directFetch } = await import('@/lib/supabase');
        const { data: userData } = await directFetch('users', {
          select: 'user_type',
          eq: { id: session.user.id },
          single: true,
          authToken: session.access_token
        });

        if (userData) {
          setAuth({
            isAuthenticated: true,
            userEmail: session.user.email || null,
            userType: userData.user_type || null,
          });
        } else {
          setAuth({ isAuthenticated: false, userEmail: null, userType: null });
        }
      } else {
        setAuth({ isAuthenticated: false, userEmail: null, userType: null });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function checkAuth() {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const { directFetch } = await import('@/lib/supabase');
        const { data: userData } = await directFetch('users', {
          select: 'user_type',
          eq: { id: session.user.id },
          single: true,
          authToken: session.access_token
        });

        if (userData) {
          setAuth({
            isAuthenticated: true,
            userEmail: session.user.email || null,
            userType: userData.user_type || null,
          });
        } else {
          setAuth({ isAuthenticated: false, userEmail: null, userType: null });
        }
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    }
  }

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}
