import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authAPI } from '@/api'
const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      isAuthenticated: false,
      login: async (credentials) => {
        set({ isLoading: true })
        try {
          const { data } = await authAPI.login(credentials)
          const { user, accessToken, refreshToken } = data.data
          localStorage.setItem('accessToken', accessToken)
          localStorage.setItem('refreshToken', refreshToken)
          set({ user, accessToken, refreshToken, isAuthenticated: true, isLoading: false })
          return { success: true, user }
        } catch (err) {
          set({ isLoading: false })
          throw err
        }
      },
      register: async (userData) => {
        set({ isLoading: true })
        try {
          const { data } = await authAPI.register(userData)
          set({ isLoading: false })
          return { success: true, data: data.data }
        } catch (err) {
          set({ isLoading: false })
          throw err
        }
      },
      logout: async () => {
        try { await authAPI.logout() } catch {}
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
      },
      updateUser: (userData) => {
        set((state) => ({ user: { ...state.user, ...userData } }))
      },
      fetchMe: async () => {
        try {
          const { data } = await authAPI.me()
          set({ user: data.data, isAuthenticated: true })
        } catch {
          get().logout()
        }
      },
      hasRole: (roles) => {
        const { user } = get()
        if (!user) return false
        return Array.isArray(roles) ? roles.includes(user.role) : user.role === roles
      },
      isAdmin: () => {
        const { user } = get()
        return user?.role === 'admin' || user?.role === 'superadmin'
      },
      isOwner: () => get().user?.role === 'owner',
      isCustomer: () => get().user?.role === 'customer',
    }),
    {
      name: 'equiprent-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
export default useAuthStore