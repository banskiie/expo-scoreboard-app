import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { FIREBASE_AUTH } from "@/firebase"

type AuthStore = {
  user: any
  isAuth: boolean
  updateAuth: (status: boolean) => void
  setUser: (user: any) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuth: false,
      setUser: (user: any) => set(() => ({ user })),
      updateAuth: (status: boolean) => set(() => ({ isAuth: status })),
      logout: () => {
        FIREBASE_AUTH.signOut()
        set(() => ({ isAuth: false, user: null }))
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
