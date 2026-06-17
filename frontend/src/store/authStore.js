import { create } from 'zustand';
import { supabase } from '@/lib/supabaseClient';

const DUMMY_USER = {
  id: 'dummy-user-1',
  phone: '+919999999999',
  email: 'demo@lymlyn.com',
  role: 'authenticated'
};

const DUMMY_PROFILE = {
  id: 'dummy-user-1',
  full_name: 'Demo User',
  phone: '+91 99999 99999',
  address: '123 Premium St, New Delhi, India',
  created_at: new Date().toISOString()
};

const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  authModal: false,

  setAuthModal: (open) => set({ authModal: open }),

  dummySignIn: (isAdmin = false) => {
    localStorage.setItem('dummy_auth', 'true');
    if (isAdmin) {
      localStorage.setItem('dummy_admin', 'true');
    } else {
      localStorage.removeItem('dummy_admin');
    }
    
    const profile = { ...DUMMY_PROFILE };
    if (isAdmin) {
      profile.admin_role = 'super_admin';
      profile.full_name = 'Admin User';
    }
    
    set({ user: DUMMY_USER, profile, loading: false, authModal: false });
  },

  initialize: async () => {
    // Check dummy auth
    if (localStorage.getItem('dummy_auth') === 'true') {
      const isAdmin = localStorage.getItem('dummy_admin') === 'true';
      const profile = { ...DUMMY_PROFILE };
      if (isAdmin) {
        profile.admin_role = 'super_admin';
        profile.full_name = 'Admin User';
      }
      set({ user: DUMMY_USER, profile, loading: false });
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
      if (localStorage.getItem('dummy_auth') === 'true') return;
      if (session?.user) {
        set({ user: session.user });
        await get().fetchProfile(session.user.id);
      } else {
        set({ user: null, profile: null });
      }
    });
  },

  fetchProfile: async (userId) => {
    if (localStorage.getItem('dummy_auth') === 'true') return;
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

    if (localStorage.getItem('dummy_auth') === 'true') {
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
    localStorage.removeItem('dummy_auth');
    await supabase.auth.signOut();
    set({ user: null, profile: null });
  },
}));

export default useAuthStore;
