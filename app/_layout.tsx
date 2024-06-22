import { useAuthStore } from "@/store/auth"
import { Stack, useRouter } from "expo-router"
import { useEffect } from "react"

export default () => {
  const { isAuth } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (isAuth) {
      router.push("/(games)")
    } else {
      router.replace("/")
    }
  }, [isAuth, router])

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  )
}
