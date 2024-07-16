import { Ionicons } from "@expo/vector-icons"
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Pressable,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { FIRESTORE_DB } from "@/firebase"
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  where,
} from "firebase/firestore"
import { useState, useEffect } from "react"
import { useAuthStore } from "@/store/auth"

const fetchGames = (
  setGames: React.Dispatch<React.SetStateAction<any>>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setError: React.Dispatch<React.SetStateAction<boolean>>,
  court: string
): (() => void) => {
  const ref = collection(FIRESTORE_DB, "games")
  const q = query(
    ref,
    where("details.court", "==", court ?? ""),
    where("statuses.current", "!=", "finished"),
    orderBy("statuses.current", "asc"),
    orderBy("time.start", "desc"),
    orderBy("details.created_date", "asc")
  )

  return onSnapshot(q, {
    next: (snapshot) => {
      const games = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setGames(games)
      setError(false)
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
  const [games, setGames] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<boolean>(false)
  const { user } = useAuthStore()

  useEffect(() => {
    if (!user || !user.displayName) {
      setError(true)
      return
    }

    const unsubscribe = fetchGames(
      setGames,
      setLoading,
      setError,
      user.displayName
    )

    return () => unsubscribe()
  }, [user])

  const statusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "lightgrey"
      case "current":
        return "#e0f0e3"
      case "finished":
        return "#A7C7E7"
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.add} onPress={() => router.push("add")}>
        <View style={styles.add_view}>
          <Ionicons style={{ fontSize: 18 }} name="add-circle-outline" />
          <Text style={{ fontWeight: 600, fontSize: 18 }}>New Game</Text>
        </View>
      </TouchableOpacity>
      {loading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={games}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: "score",
                  params: {
                    id: item.id,
                  },
                })
              }
            >
              <View style={styles.card_header}>
                <Text
                  style={{ textTransform: "uppercase", fontWeight: "bold" }}
                >
                  {item.details.category.split(".")[0]}{" "}
                  {item.details.category.split(".")[1]}
                </Text>
                <View style={styles.rounds}>
                  {Array.from({ length: item.details.no_of_sets }).map(
                    (_, index) => (
                      <View style={styles.round} key={index}>
                        <Text style={styles.round_no}>{index + 1}</Text>
                      </View>
                    )
                  )}
                </View>
              </View>
              <View style={styles.score_container}>
                <View style={styles.team_container}>
                  <View style={styles.teams}>
                    {/* Team A */}
                    <Text style={styles.player}>
                      {item.players.team_a.player_1.use_nickname
                        ? item.players.team_a.player_1.nickname
                        : `${item.players.team_a.player_1.first_name} ${item.players.team_a.player_1.last_name}`}
                    </Text>
                    {item.details.category.split(".")[1] === "doubles" && (
                      <Text style={styles.player}>
                        {item.players.team_a.player_2.use_nickname
                          ? item.players.team_a.player_2.nickname
                          : `${item.players.team_a.player_2.first_name} ${item.players.team_a.player_2.last_name}`}
                      </Text>
                    )}
                  </View>
                  <View style={styles.scores}>
                    {Array.from({ length: item.details.no_of_sets }).map(
                      (_, index) => (
                        <View
                          style={{
                            ...styles.score_card,
                            backgroundColor:
                              item.time.start &&
                              index + 1 == item.details.playing_set
                                ? "#e0f0e3"
                                : "lightgrey",
                          }}
                          key={index}
                        >
                          <Text style={styles.score}>
                            {item.sets[`set_${index + 1}`].a_score}
                          </Text>
                        </View>
                      )
                    )}
                  </View>
                </View>
                {/* Divider */}
                <View style={styles.divider}></View>
                <View style={styles.team_container}>
                  <View style={styles.teams}>
                    {/* Team B */}
                    <Text style={styles.player}>
                      {item.players.team_b.player_1.use_nickname
                        ? item.players.team_b.player_1.nickname
                        : `${item.players.team_b.player_1.first_name} ${item.players.team_b.player_1.last_name}`}
                    </Text>
                    {item.details.category.split(".")[1] === "doubles" && (
                      <Text style={styles.player}>
                        {item.players.team_b.player_2.use_nickname
                          ? item.players.team_b.player_2.nickname
                          : `${item.players.team_b.player_2.first_name} ${item.players.team_b.player_2.last_name}`}
                      </Text>
                    )}
                  </View>
                  <View style={styles.scores}>
                    {Array.from({ length: item.details.no_of_sets }).map(
                      (_, index) => (
                        <View
                          style={{
                            ...styles.score_card,
                            backgroundColor:
                              item.time.start &&
                              index + 1 == item.details.playing_set
                                ? "#FAC898"
                                : "lightgrey",
                          }}
                          key={index}
                        >
                          <Text style={styles.score}>
                            {item.sets[`set_${index + 1}`].b_score}
                          </Text>
                        </View>
                      )
                    )}
                  </View>
                </View>
              </View>
              <View style={styles.footer}>
                <Text style={styles.best}>
                  Best of {item.details.no_of_sets}
                </Text>
                <Text
                  style={{
                    ...styles.status,
                    backgroundColor: statusColor(item.statuses.current),
                  }}
                >
                  {item.statuses.current}
                </Text>
              </View>
            </Pressable>
          )}
          keyExtractor={(game) => game.id}
        />
      )}
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
  add_view: {
    gap: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    marginVertical: 6,
    padding: 12,
    elevation: 2,
    marginHorizontal: 2,
    gap: 2,
  },
  card_header: {
    width: "100%",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rounds: { flexDirection: "row", gap: 5 },
  round: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  round_no: { color: "gray", fontWeight: "bold" },
  score_container: {
    height: 140,
    flexDirection: "column",
    justifyContent: "space-evenly",
  },
  team_container: {
    height: 60,
    width: "100%",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  teams: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-evenly",
  },
  player: {
    fontSize: 18,
  },
  scores: {
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 5,
  },
  score_card: {
    width: 40,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  score: { fontSize: 30, fontWeight: "bold" },
  divider: {
    width: "100%",
    height: 2,
    backgroundColor: "lightgrey",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  best: {
    color: "gray",
    textTransform: "uppercase",
    fontWeight: "bold",
  },
  status: {
    textTransform: "uppercase",
    fontWeight: "bold",
    width: 100,
    textAlign: "center",
    paddingVertical: 1,
    borderRadius: 4,
  },
})
