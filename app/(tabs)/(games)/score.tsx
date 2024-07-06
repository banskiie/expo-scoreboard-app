import { Tabs, usePathname } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { Text, View, StatusBar, StyleSheet } from "react-native"
import { useEffect, useState } from "react"

interface IconWithLabelProps {
  name: any
  label: string
  color: string
  size: number
}

const IconWithLabel = ({ name, label, color, size }: IconWithLabelProps) => (
  <View style={styles.tab}>
    <Ionicons name={name} size={size} color={color} />
    <Text style={{ color, fontSize: 12 }}>{label}</Text>
  </View>
)

export default () => {
  const pathname = usePathname()

  return (
    <Tabs
      screenOptions={{
        headerTitleAlign: "center",
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 80,
        },
        headerTitleStyle: styles.title,
        headerStatusBarHeight: StatusBar.currentHeight,
        tabBarActiveTintColor: "black",
      }}
    >
      <Tabs.Screen
        name="(games)"
        options={{
          title: "Games",
          tabBarIcon: ({ color, size, focused }) => (
            <IconWithLabel
              name={focused ? "list-circle" : "list-circle-outline"}
              label="Games"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="(history)"
        options={{
          title: "History",
          tabBarIcon: ({ color, size, focused }) => (
            <IconWithLabel
              name={focused ? "book" : "book-outline"}
              label="History"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="(settings)"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size, focused }) => (
            <IconWithLabel
              name={focused ? "settings" : "settings-outline"}
              label="Settings"
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tab: { alignItems: "center", width: 70, gap: 4 },
  title: {
    textTransform: "capitalize",
    fontWeight: 600,
  },
})
