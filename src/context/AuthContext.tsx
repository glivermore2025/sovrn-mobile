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

    // Handle incoming deep links: if the URL contains Supabase tokens
    // (access_token & refresh_token), exchange them for a local session.
    let linkSub: any = null;

    async function handleUrl(url?: string | null) {
      if (!url) return;
      console.info('Handling URL:', url);

      // Supabase magic links usually include tokens in the fragment (after '#')
      const [, hash] = url.split('#');
      const fragment = hash ?? url.split('?')[1];
      if (!fragment) {
        console.info('No fragment/query in URL to process');
        return;
      }

      const params = Object.fromEntries(
        fragment.split('&').map((p) => {
          const [k, v] = p.split('=');
          return [k, decodeURIComponent(v ?? '')];
        })
      ) as Record<string, string>;

      const access_token = params['access_token'];
      const refresh_token = params['refresh_token'];

      if (access_token && refresh_token) {
        try {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (error) console.warn('supabase.auth.setSession error', error);
          else console.info('Supabase session set from link');
        } catch (err) {
          console.warn('Failed to set Supabase session from URL', err);
        }
      } else {
        console.info('URL did not contain supabase tokens');
      }
    }

    (async () => {
      try {
        const initial = await Linking.getInitialURL();
        if (initial) {
          console.info('Initial URL:', initial);
          await handleUrl(initial);
        }
      } catch (err) {
        console.warn('Linking.getInitialURL failed', err);
      }

      linkSub = Linking.addEventListener('url', ({ url }) => {
        console.info('Opened by URL:', url);
        handleUrl(url);
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
