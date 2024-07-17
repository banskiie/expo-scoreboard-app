import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native"
import { useEffect, useState } from "react"
import { FIRESTORE_DB } from "@/firebase"
import {
  collection,
  doc,
  DocumentSnapshot,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  updateDoc,
  where,
} from "firebase/firestore"
import { router } from "expo-router"

const Settings = ({ id }: any) => {
  const [loading, setLoading] = useState<boolean>(false)
  const [data, setData] = useState<any>(null)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const ref = doc(FIRESTORE_DB, "games", id)

  useEffect(() => {
    const sub = onSnapshot(ref, {
      next: (snapshot: DocumentSnapshot) => {
        if (snapshot.exists()) {
          const snap = snapshot.data()
          if (!!snap.time.start) {
            setIsPlaying(true)
          } else {
            setIsPlaying(false)
          }
          setData(snap)
        }
      },
    })

    return () => sub()
  }, [id])

  const scoreboard = async () => {
    setLoading(true)
    try {
      if (ref) {
        await runTransaction(FIRESTORE_DB, async (transaction) => {
          const snap = await transaction.get(doc(FIRESTORE_DB, "games", id))
          const game = snap.data()
          // Game Update
          transaction.update(ref, {
            ...data,
            statuses: {
              ...data.statuses,
              active: !game?.statuses.active,
              focus: Date.now(),
            },
          })
          // Court Update
          const courtName = game?.details.court
          const courtQuery = query(
            collection(FIRESTORE_DB, "courts"),
            where("court_name", "==", courtName)
          )
          const courtSnapshot = await getDocs(courtQuery)
          if (!courtSnapshot.empty) {
            transaction.update(
              doc(FIRESTORE_DB, "courts", courtSnapshot.docs[0].id),
              {
                court_in_use: !game?.statuses.active,
              }
            )
          }
        })
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const focus = async () => {
    setLoading(true)
    try {
      await updateDoc(ref, {
        statuses: {
          ...data.statuses,
          focus: Date.now(),
        },
      })
    } catch (error: any) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const reset = async () => {
    setLoading(true)
    try {
      await updateDoc(ref, {
        sets: {
          ...data.sets,
          [`set_${data.details.playing_set}`]: {
            a_score: 0,
            b_score: 0,
            current_round: 1,
            last_team_scored: "",
            scoresheet: [
              {
                team_scored: "",
                scored_at: "",
                current_a_score: 0,
                current_b_score: 0,
                a_switch: true,
                b_switch: true,
                scorer: "",
                to_serve: "",
                next_serve: "",
              },
            ],
            switch: false,
            shuttles_used: 0,
            winner: "",
          },
        },
        statuses: {
          ...data.statuses,
          focus: Date.now(),
        },
      })
    } catch (error: any) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const switchSide = async () => {
    setLoading(true)
    try {
      await updateDoc(ref, {
        sets: {
          ...data.sets,
          [`set_${data.details.playing_set}`]: {
            ...data.sets[`set_${data.details.playing_set}`],
            switch: !data.sets[`set_${data.details.playing_set}`].switch,
          },
        },
        statuses: {
          ...data.statuses,
          focus: Date.now(),
        },
      })
    } catch (error: any) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const force = async (team: string) => {
    setLoading(true)
    try {
      const current = `set_${data.details.playing_set}`

      switch (team) {
        case "a":
          await updateDoc(ref, {
            sets: {
              ...data.sets,
              [`set_${data.details.playing_set}`]: {
                ...data.sets[current],
                winner: team,
              },
            },
            statuses: {
              ...data.statuses,
              focus: Date.now(),
            },
          })
          break
        case "b":
          await updateDoc(ref, {
            sets: {
              ...data.sets,
              [`set_${data.details.playing_set}`]: {
                ...data.sets[current],
                winner: team,
              },
            },
            statuses: {
              ...data.statuses,
              focus: Date.now(),
            },
          })
          break
      }
    } catch (error: any) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const showForceWin = () =>
    Alert.alert("Force Win", "This will force this set to be won by a team.", [
      {
        text: "Cancel",
        style: "destructive",
      },
      {
        text: !!data?.players.team_a.team_name
          ? data?.players.team_a.team_name
          : "Team A",
        onPress: () => force("a"),
        style: "default",
      },
      {
        text: !!data?.players.team_b.team_name
          ? data?.players.team_b.team_name
          : "Team B",
        onPress: () => force("b"),
        style: "default",
      },
    ])

  return (
    <View style={styles.settings_container}>
      <TouchableOpacity
        style={{
          ...styles.setting_button,
          backgroundColor: "#bdddfc",
        }}
        disabled={loading || !isPlaying}
        onPress={scoreboard}
      >
        <Text
          style={{
            fontSize: 36,
            textAlign: "center",
            fontWeight: 700,
            textTransform: "uppercase",
          }}
        >
          {!data?.statuses?.active ? "Show" : "Hide"} Scoreboard
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{
          ...styles.setting_button,
          backgroundColor: "#a8dcab",
        }}
        disabled={loading || !isPlaying}
        onPress={() =>
          router.push({
            pathname: "add",
            params: { id },
          })
        }
      >
        <Text
          style={{
            fontSize: 36,
            textAlign: "center",
            fontWeight: 700,
            textTransform: "uppercase",
          }}
        >
          Edit Game
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{
          ...styles.setting_button,
          backgroundColor: "#ffc067",
        }}
        onPress={focus}
      >
        <Text
          style={{
            fontSize: 36,
            textAlign: "center",
            fontWeight: 700,
            textTransform: "uppercase",
          }}
        >
          Focus Game
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{
          ...styles.setting_button,
          backgroundColor: "#ffee8c",
        }}
        disabled={loading || !isPlaying}
        onPress={switchSide}
      >
        <Text
          style={{
            fontSize: 36,
            textAlign: "center",
            fontWeight: 700,
            textTransform: "uppercase",
          }}
        >
          Switch Side
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{
          ...styles.setting_button,
          backgroundColor: "#e491a6",
        }}
        disabled={loading || !isPlaying}
        onPress={reset}
      >
        <Text
          style={{
            fontSize: 36,
            textAlign: "center",
            fontWeight: 700,
            textTransform: "uppercase",
          }}
        >
          Reset Set
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{
          ...styles.setting_button,
          backgroundColor: "#ccccff",
        }}
        disabled={loading || !isPlaying}
        onPress={showForceWin}
      >
        <Text
          style={{
            fontSize: 36,
            textAlign: "center",
            fontWeight: 700,
            textTransform: "uppercase",
          }}
        >
          Force Win Set
        </Text>
      </TouchableOpacity>
    </View>
  )
}

export default Settings

const styles = StyleSheet.create({
  settings_container: {
    height: "100%",
    width: "100%",
    alignItems: "center",
    flexWrap: "wrap",
    flexDirection: "row",
    justifyContent: "space-evenly",
    rowGap: 15,
    padding: 15,
  },
  setting_button: {
    width: "32%",
    height: "40%",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
})
