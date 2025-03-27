import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import NotificationService from '../services/notificationService';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create(
  persist<AuthState>(
    (set) => ({
      user: null,
      loading: true,
      error: null,

      setUser: (user) => set({ user }),

      signIn: async (email, password) => {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) {
          NotificationService.notify('Sign-in failed. Please check your credentials.');
          throw authError;
        }

        if (authData.user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', authData.user.id)
            .maybeSingle();

          if (profileError) {
            NotificationService.notify('Failed to fetch user profile.');
            throw profileError;
          }

          let userRole = profile?.role || 'user';

          if (!profile) {
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert([{ id: authData.user.id, role: userRole }])
              .select('role')
              .single();

            if (createError) {
              NotificationService.notify('Failed to create user profile.');
              throw createError;
            }
            userRole = newProfile.role;
          }

          set({
            user: {
              id: authData.user.id,
              email: authData.user.email!,
              role: userRole,
            },
          });

          NotificationService.notify('Sign-in successful.');
        }
      },

      signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null });
        NotificationService.notify('Sign-out successful.');
      },

      fetchUser: async () => {
        set({ loading: true });

        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData.session;

        if (session?.user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profileError) {
            set({ loading: false });
            NotificationService.notify('Failed to fetch user profile.');
            return;
          }

          set({
            user: {
              id: session.user.id,
              email: session.user.email!,
              role: profile?.role || 'user',
            },
            loading: false,
          });

          NotificationService.notify('User fetched successfully.');
        } else {
          set({ user: null, loading: false });
          NotificationService.notify('No user session found.');
        }
      },
    }),
    {
      name: 'auth-storage', // Key for local storage persistence
    }
  )
);