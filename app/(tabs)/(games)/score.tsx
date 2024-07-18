import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native"
import { useEffect, useState } from "react"
import { router, useLocalSearchParams } from "expo-router"
import Score from "@/components/pages/Score"
import Settings from "@/components/pages/Settings"
import Scoresheet from "@/components/pages/Scoresheet"
import Details from "@/components/pages/Details"
import * as ScreenOrientation from "expo-screen-orientation"
import { FIRESTORE_DB } from "@/firebase"
import { doc, onSnapshot, DocumentSnapshot } from "firebase/firestore"
import Entypo from "@expo/vector-icons/Entypo"

export default () => {
  const { id } = useLocalSearchParams()
  const [view, setView] = useState<string>("")
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [hasEnded, setHasEnded] = useState<boolean>(false)
  const [data, setData] = useState<any>()

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE)

    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT)
    }
  }, [])

  useEffect(() => {
    if (typeof id === "string") {
      const ref = doc(FIRESTORE_DB, "games", id)
      const sub = onSnapshot(ref, {
        next: (snapshot: DocumentSnapshot) => {
          if (snapshot.exists()) {
            const snap = snapshot.data()
            if (!!snap.time.start) {
              setIsPlaying(true)
            } else {
              setIsPlaying(false)
            }
            if (!!snap.time.end) {
              setHasEnded(true)
              setView("Scoresheet")
            } else {
              setHasEnded(false)
              setView("Score")
            }
            setData(snap)
          }
        },
      })
      return () => sub()
    }
  }, [id])

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

  if (view == "") {
    return <ActivityIndicator />
  }

  return (
    <View style={styles.container}>
      <View style={styles.upper_tabs}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            ...styles.button,
            backgroundColor: "white",
            width: "8%",
            position: hasEnded ? "absolute" : "relative",
            left: 0,
            zIndex: 100,
            top: hasEnded ? 10 : 0,
          }}
        >
          <Entypo name="back" size={24} color="orangered" />
        </TouchableOpacity>
        {!hasEnded && (
          <>
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
          </>
        )}
        <TouchableOpacity
          onPress={() => setView("Scoresheet")}
          style={{
            ...styles.button,
            backgroundColor: view === "Scoresheet" ? "#f2f2f2" : "white",
          }}
          disabled={!isPlaying}
        >
          <Text
            style={{
              ...styles.button_text,
              color: isPlaying ? "black" : "#a1a1a1",
            }}
          >
            Scoresheet
          </Text>
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
    width: "23%",
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
