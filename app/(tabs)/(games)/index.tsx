import { Ionicons } from "@expo/vector-icons"
import { StyleSheet, Text, View, TouchableOpacity } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"

export default () => {
  const router = useRouter()

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.add} onPress={() => router.push("add")}>
        <View style={styles.add_view}>
          <Ionicons style={{ fontSize: 18 }} name="add-circle-outline" />
          <Text style={{ fontWeight: 600, fontSize: 18 }}>New Game</Text>
        </View>
      </TouchableOpacity>
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
  },
  add_view: {
    gap: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
})
