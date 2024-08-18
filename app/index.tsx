import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  TouchableHighlight,
} from "react-native"
import { Image } from "expo-image"
import { Dropdown } from "react-native-element-dropdown"
import { useEffect, useState } from "react"
import { FIREBASE_AUTH, FIRESTORE_DB } from "@/firebase"
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  DocumentData,
} from "firebase/firestore"
import { signInWithEmailAndPassword } from "firebase/auth"
import { useAuthStore } from "@/store/auth"
import * as ScreenOrientation from "expo-screen-orientation"
import { Option } from "@/types/all"
import React from "react"

const fetchCourts = (
  setCourts: React.Dispatch<React.SetStateAction<Option[]>>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setError: React.Dispatch<React.SetStateAction<boolean>>
): (() => void) => {
  const ref = collection(FIRESTORE_DB, "courts")
  const q = query(ref, orderBy("created_date", "asc"))

  return onSnapshot(q, {
    next: (snapshot) => {
      const courts = snapshot.docs.map((doc: DocumentData) => ({
        label: doc.data().court_name,
        value: doc.data().court_email,
      }))
      setError(false)
      setCourts(courts)
      setLoading(false)
    },
    error: (error) => {
      console.error(error)
      setLoading(false)
      setError(true)
    },
  })
}

export default () => {
  const { updateAuth, setUser } = useAuthStore()
  const [email, setEmail] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [courts, setCourts] = useState<Option[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<boolean>(false)

  useEffect(() => {
    const unsubscribe = fetchCourts(setCourts, setLoading, setError)
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT)
    return () => {
      ScreenOrientation.unlockAsync()
      unsubscribe()
    }
  }, [])

  const signIn = async () => {
    setLoading(true)
    setError(false)
    try {
      const test = await signInWithEmailAndPassword(
        FIREBASE_AUTH,
        email,
        password
      )
      setUser(test.user)
      updateAuth(true)
    } catch (error: unknown) {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size={200} color="black" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={{ width: "80%", gap: 15 }}>
        <Image
          source={require("@/assets/images/logo.png")}
          contentFit="contain"
          style={styles.logo}
          transition={500}
        />
        <Dropdown
          style={styles.dropdown}
          containerStyle={{ marginTop: -24, borderRadius: 12 }}
          data={courts}
          mode="default"
          labelField="label"
          valueField="value"
          placeholder="Select Court"
          onChange={(court: any) => {
            setEmail(court.value)
            setPassword(court.value.split("@")[0])
          }}
        />
        <TouchableHighlight
          activeOpacity={0.6}
          underlayColor="#ffd700"
          onPress={signIn}
          disabled={!email || !password}
          style={{ borderRadius: 12 }}
        >
          <View
            style={{
              ...styles.button,
              backgroundColor: !email || !password ? "#bbbbbb" : "#fae466",
              elevation: !email || !password ? 0 : 2,
            }}
          >
            <Text
              style={{
                textAlign: "center",
                fontSize: 18,
                fontWeight: 600,
                color: !email || !password ? "gray" : "black",
              }}
            >
              Continue
            </Text>
          </View>
        </TouchableHighlight>
      </View>
      <Text style={styles.footer}>© 2024 | C-ONE Development Team</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    width: "100%",
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  dropdown: {
    borderRadius: 12,
    backgroundColor: "#E6E6E6",
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  logo: { width: "100%", height: "50%", marginBottom: -40 },
  footer: { position: "absolute", bottom: "8%" },
})
