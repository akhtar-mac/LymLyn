import { create } from 'zustand';
import { supabase } from '@/lib/supabaseClient';

const DUMMY_USER = {
  id: 'dummy-admin-1',
  phone: '+919999999999',
  email: 'admin@lymlyn.com',
  role: 'authenticated'
};

const DUMMY_PROFILE = {
  id: 'dummy-admin-1',
  full_name: 'Admin User',
  phone: '+91 99999 99999',
  address: '123 Premium St, New Delhi, India',
  admin_role: 'super_admin',
  created_at: new Date().toISOString()
};

const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  authModal: false,

  setAuthModal: (open) => set({ authModal: open }),

  dummySignIn: () => {
    localStorage.setItem('dummy_admin', 'true');
    set({ user: DUMMY_USER, profile: DUMMY_PROFILE, loading: false });
  },

  initialize: async () => {
    if (localStorage.getItem('dummy_admin') === 'true') {
      set({ user: DUMMY_USER, profile: DUMMY_PROFILE, loading: false });
      return;
    }

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
      if (localStorage.getItem('dummy_admin') === 'true') return;
      if (session?.user) {
        set({ user: session.user });
        await get().fetchProfile(session.user.id);
      } else {
        set({ user: null, profile: null });
      }
    });
  },

  fetchProfile: async (userId) => {
    if (localStorage.getItem('dummy_admin') === 'true') return;
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

    if (localStorage.getItem('dummy_admin') === 'true') {
      set({ profile: { ...get().profile, ...updates } });
      return { data: get().profile, error: null };
    }

    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, ...updates })
      .select()
      .single();

    if (!error) set({ profile: data });
    return { data, error };
  },

  signOut: async () => {
    localStorage.removeItem('dummy_admin');
    await supabase.auth.signOut();
    set({ user: null, profile: null });
  },
}));

export default useAuthStore;
