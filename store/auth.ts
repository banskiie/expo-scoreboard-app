import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { FIREBASE_AUTH } from "@/firebase"

type AuthStore = {
  isAuth: boolean
  updateAuth: (status: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      isAuth: false,
      updateAuth: (status: boolean) => set(() => ({ isAuth: status })),
      logout: () => {
        FIREBASE_AUTH.signOut()
        set(() => ({ isAuth: false }))
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
