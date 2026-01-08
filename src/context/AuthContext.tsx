import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as Linking from 'expo-linking';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type AuthCtx = {
  session: Session | null;
  initializing: boolean;
};

const AuthContext = createContext<AuthCtx>({ session: null, initializing: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session ?? null);
      setInitializing(false);
    })();

    // Debug: log incoming deep links so we can verify the magic-link redirect
    // (no production behavior here, just helpful logs while testing)
    let linkSub: any = null;

    (async () => {
      try {
        const initial = await Linking.getInitialURL();
        if (initial) console.info('Initial URL:', initial);
      } catch (err) {
        console.warn('Linking.getInitialURL failed', err);
      }

      linkSub = Linking.addEventListener('url', ({ url }) => {
        console.info('Opened by URL:', url);
      });
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
      linkSub?.remove?.();
    };
  }, []);

  const value = useMemo(() => ({ session, initializing }), [session, initializing]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
