import { create } from 'zustand'
import supabase from '../lib/supabaseClient'

const useAuthStore = create((set, get) => ({
  user: null,
  session: null,
  loading: true,
  authModalOpen: false,
  authModalTab: 'login', // 'login' | 'register'

  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
      loading: false,
    }),

  setLoading: (loading) => set({ loading }),

  openAuthModal: (tab = 'login') =>
    set({ authModalOpen: true, authModalTab: tab }),

  closeAuthModal: () => set({ authModalOpen: false }),

  signOut: async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    set({ user: null, session: null })
  },

  getAccessToken: async () => {
    if (!supabase) return null
    const { data } = await supabase.auth.getSession()
    return data?.session?.access_token ?? null
  },

  isAuthEnabled: () => supabase !== null,
}))

export default useAuthStore
