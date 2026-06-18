import { create } from 'zustand';
import { supabase } from '@/lib/supabaseClient';

const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  authModal: false,

  setAuthModal: (open) => set({ authModal: open }),

  dummySignIn: async (phone, otp) => {
    if (otp !== '123456') {
      throw new Error('Invalid OTP code. Please use the demo code 123456.');
    }

    // Generate a unique email for this phone number
    const cleanPhone = phone.replace(/\D/g, '');
    const email = `${cleanPhone}@lymlyn.com`;
    const password = `lymlyn-dummy-123456`; // They must enter the same OTP to login again

    // Try to sign in first
    let { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // If invalid login or email not confirmed, we need to register/confirm via backend
    if (error && (error.message.includes('Invalid login credentials') || error.message.includes('Email not confirmed'))) {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/dummy-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp })
      });
      
      if (!res.ok) {
        throw new Error('Failed to register user. Please try again.');
      }

      // Now sign in should work perfectly since email is confirmed
      const retry = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (retry.error) {
        throw retry.error;
      }
    } else if (error) {
      console.error('Dummy Auth Error:', error);
      throw error;
    }

    set({ authModal: false });
    // Note: onAuthStateChange will handle setting the user state
  },

  initialize: async () => {
    // Clean up any old fake dummy auth from localStorage if it exists
    localStorage.removeItem('dummy_auth');
    localStorage.removeItem('dummy_admin');

    // Get initial session
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await get().fetchProfile(session.user.id);
      set({ user: session.user, loading: false });
    } else {
      set({ loading: false });
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        set({ user: session.user });
        await get().fetchProfile(session.user.id);
      } else {
        set({ user: null, profile: null });
      }
    });
  },

  fetchProfile: async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    set({ profile: data || null });
  },

  updateProfile: async (updates) => {
    const { user } = get();
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, ...updates })
      .select()
      .single();

    if (!error) set({ profile: data });
    return { data, error };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null });
  },
}));

export default useAuthStore;
