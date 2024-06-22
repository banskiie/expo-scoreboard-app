import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { Option } from "@/types/all"
import { FIRESTORE_DB } from "@/firebase"
import { collection, query, orderBy, onSnapshot } from "firebase/firestore"
import { useEffect, useState } from "react"
import * as ScreenOrientation from "expo-screen-orientation"
import { Dropdown } from "react-native-element-dropdown"

const fetchCategories = (
  setCategories: React.Dispatch<React.SetStateAction<Option[]>>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setError: React.Dispatch<React.SetStateAction<boolean>>
): (() => void) => {
  const ref = collection(FIRESTORE_DB, "categories")
  const q = query(ref, orderBy("created_date", "asc"))

  return onSnapshot(q, {
    next: (snapshot) => {
      const categories = snapshot.docs.map((doc: any) => ({
        label: `${doc.data().category_name} (${doc.data().category_type})`,
        value: `${doc.data().category_name}.${doc.data().category_type}`,
      }))
      console.log(categories)
      setError(false)
      setCategories(categories)
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
  const router = useRouter()
  const [categories, setCategories] = useState<Option[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<boolean>(false)

  useEffect(() => {
    const unsubscribe = fetchCategories(setCategories, setLoading, setError)
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT)
    return () => {
      ScreenOrientation.unlockAsync()
      unsubscribe()
    }
  }, [])

  return (
    <View>
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.6}
          onPress={() => router.back()}
          style={{ ...styles.action, backgroundColor: "#E6E6E6" }}
        >
          <View style={styles.back}>
            <Ionicons style={{ marginLeft: -8 }} name="arrow-back-outline" />
            <Text style={{ fontWeight: "bold" }}>Back</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.6}
          onPress={() => router.back()}
          style={{ ...styles.action, backgroundColor: "#fae466" }}
        >
          <Text style={{ fontWeight: "bold" }}>Submit</Text>
        </TouchableOpacity>
      </View>
      <ScrollView>
        <View style={styles.form}>
          <View style={styles.form_item}>
            <Text
              style={{ fontWeight: 600, fontSize: 20, paddingHorizontal: 4 }}
            >
              Category
            </Text>
            <Dropdown
              style={styles.dropdown}
              containerStyle={{ marginTop: -24, borderRadius: 12 }}
              data={categories}
              mode="default"
              labelField="label"
              valueField="value"
              placeholder="Select Category"
              onChange={(item: Option) => {
                // setEmail(item.value)
                // setPassword(item.value.split("@")[0])
              }}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  dropdown: {
    borderRadius: 12,
    backgroundColor: "#E6E6E6",
    height: 50,
    paddingHorizontal: 15,
    // paddingVertical: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
  },
  action: {
    height: 40,
    width: 100,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  back: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  form: { padding: 10, gap: 10 },
  form_item: {
    gap: 6,
  },
})
