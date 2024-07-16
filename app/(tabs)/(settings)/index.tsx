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
    backgroundColor: "#fae466",
    height: 50,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    marginVertical: 6,
  },
})
