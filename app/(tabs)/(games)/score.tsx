import { Text, View, StyleSheet, TouchableOpacity } from "react-native"
import { useEffect, useState } from "react"
import { useLocalSearchParams } from "expo-router"
import Score from "@/components/pages/Score"
import Settings from "@/components/pages/Settings"
import Scoresheet from "@/components/pages/Scoresheet"
import Details from "@/components/pages/Details"
import * as ScreenOrientation from "expo-screen-orientation"

export default () => {
  const [view, setView] = useState<string>("Score")
  const { id } = useLocalSearchParams()

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE)
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT)
    }
  }, [])

  const renderView = () => {
    switch (view) {
      case "Score":
        return <Score id={id} />
      case "Settings":
        return <Settings id={id} />
      case "Scoresheet":
        return <Scoresheet id={id} />
      case "Details":
        return <Details id={id} />
      default:
        return <Score id={id} />
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.upper_tabs}>
        <TouchableOpacity
          onPress={() => setView("Score")}
          style={{
            ...styles.button,
            backgroundColor: view === "Score" ? "#f2f2f2" : "white",
          }}
        >
          <Text style={styles.button_text}>Score</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setView("Settings")}
          style={{
            ...styles.button,
            backgroundColor: view === "Settings" ? "#f2f2f2" : "white",
          }}
        >
          <Text style={styles.button_text}>Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setView("Scoresheet")}
          style={{
            ...styles.button,
            backgroundColor: view === "Scoresheet" ? "#f2f2f2" : "white",
          }}
        >
          <Text style={styles.button_text}>Scoresheet</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setView("Details")}
          style={{
            ...styles.button,
            backgroundColor: view === "Details" ? "#f2f2f2" : "white",
          }}
        >
          <Text style={styles.button_text}>Details</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.content}>{renderView()}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, height: "100%" },
  upper_tabs: {
    height: "8%",
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-evenly",
    backgroundColor: "white",
  },
  button: {
    width: "25%",
    borderTopRightRadius: 12,
    borderTopLeftRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  button_text: { textTransform: "uppercase", fontWeight: "bold" },
  content: {
    height: "92%",
  },
})
