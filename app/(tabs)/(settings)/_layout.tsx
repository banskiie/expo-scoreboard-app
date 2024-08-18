import { Stack } from "expo-router"
import React from "react"

export default () => {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  )
}
