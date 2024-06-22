import { useAuthStore } from "@/store/auth"
import { StyleSheet, Text, View, TouchableHighlight } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

export default () => {
  const { logout } = useAuthStore()
  return (
    <SafeAreaView style={styles.container}>
      <TouchableHighlight
        activeOpacity={0.6}
        underlayColor="#ffd700"
        onPress={logout}
      >
        <View style={styles.add}>
          <Text
            style={{
              textAlign: "center",
              fontSize: 18,
              fontWeight: 600,
            }}
          >
            Log Out
          </Text>
        </View>
      </TouchableHighlight>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  add: {
    width: "100%",
    backgroundColor: "#fae466",
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    elevation: 2,
  },
})
