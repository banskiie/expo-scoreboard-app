import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import React, { useEffect, useState } from "react"
import { FIRESTORE_DB } from "@/firebase"
import { doc, onSnapshot, DocumentSnapshot } from "firebase/firestore"
import { router } from "expo-router"

const Scoresheet = ({ id }: any) => {
  const [data, setData] = useState<any>(null)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [isDoubles, setIsDoubles] = useState<boolean>(false)
  const ref = doc(FIRESTORE_DB, "games", id)

  useEffect(() => {
    const sub = onSnapshot(ref, {
      next: (snapshot: DocumentSnapshot) => {
        if (snapshot.exists()) {
          const snap = snapshot.data()
          if (snap.details.category.split(".")[1] === "doubles") {
            setIsDoubles(true)
          } else {
            setIsDoubles(false)
          }
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

  const sets = data && Object.values(data?.sets).reverse()

  const fetchPlayerName = (player: string): string =>
    data?.players[`team_${player[0]}`][`player_${player[1]}`].use_nickname
      ? data?.players[`team_${player[0]}`][`player_${player[1]}`].nickname
      : `${
          data?.players[`team_${player[0]}`][`player_${player[1]}`].first_name
        } ${
          data?.players[`team_${player[0]}`][`player_${player[1]}`].last_name
        }`

  if (!isPlaying)
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color="black" size={200} />
      </View>
    )

  return (
    <ScrollView style={{ flex: 1 }}>
      {sets &&
        sets.map((_: any, reversedIndex: number) => {
          const originalIndex = sets.length - 1 - reversedIndex
          const scoresheet = data?.sets[`set_${originalIndex + 1}`]?.scoresheet
          const size = 21
          const chunks = []

          for (let i = 0; i < scoresheet.length; i += size) {
            chunks.push(scoresheet.slice(i, i + size))
          }

          return (
            <View
              key={originalIndex}
              style={{
                display: scoresheet.length > 1 ? "flex" : "none",
                borderBottomWidth: scoresheet.length > 1 ? 1 : 0,
                paddingBottom: 12,
              }}
            >
              {chunks.map((chunk: any, chunkIndex: number) => (
                <ScoresheetView
                  key={chunkIndex}
                  scores={chunk}
                  doubles={isDoubles}
                  fetchName={fetchPlayerName}
                  set={originalIndex + 1}
                  startingIndex={chunkIndex * size}
                />
              ))}
            </View>
          )
        })}
    </ScrollView>
  )
}

const ScoresheetView = ({
  scores,
  doubles,
  fetchName,
  set,
  startingIndex,
}: any) => {
  return (
    <ScrollView
      horizontal={true}
      contentContainerStyle={styles.scrollContainer}
    >
      <View style={styles.players}>
        <View style={styles.upper}>
          <Text
            style={{ fontSize: 16, fontWeight: "800" }}
          >{`SET ${set}`}</Text>
        </View>
        <View style={styles.player}>
          <Text style={{ fontSize: 20 }}>{fetchName("a1")}</Text>
        </View>
        {doubles && (
          <View style={styles.player}>
            <Text style={{ fontSize: 20 }}>{fetchName("a2")}</Text>
          </View>
        )}
        <View style={styles.player}>
          <Text style={{ fontSize: 20 }}>{fetchName("b1")}</Text>
        </View>
        {doubles && (
          <View style={styles.player}>
            <Text style={{ fontSize: 20 }}>{fetchName("b2")}</Text>
          </View>
        )}
      </View>
      <View style={{ flexDirection: "row" }}>
        {scores.map((item: any, index: number) => (
          <View key={index}>
            <View style={styles.upper}>
              <Text
                style={{
                  textAlign: "center",
                  fontSize: 16,
                  fontWeight: "700",
                  color: "gray",
                }}
              >
                {index + startingIndex}
              </Text>
            </View>
            <View style={styles.score}>
              <Text
                style={{
                  textAlign: "center",
                  fontSize: 20,
                  fontWeight: "bold",
                }}
              >
                {item.scorer == "a1" && item.current_a_score}
              </Text>
            </View>
            {doubles && (
              <View style={styles.score}>
                <Text
                  style={{
                    textAlign: "center",
                    fontSize: 20,
                    fontWeight: "bold",
                  }}
                >
                  {item.scorer == "a2" && item.current_a_score}
                </Text>
              </View>
            )}
            <View style={styles.score}>
              <Text
                style={{
                  textAlign: "center",
                  fontSize: 20,
                  fontWeight: "bold",
                }}
              >
                {item.scorer == "b1" && item.current_b_score}
              </Text>
            </View>
            {doubles && (
              <View style={styles.score}>
                <Text
                  style={{
                    textAlign: "center",
                    fontSize: 20,
                    fontWeight: "bold",
                  }}
                >
                  {item.scorer == "b2" && item.current_b_score}
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

export default Scoresheet

const styles = StyleSheet.create({
  scrollContainer: {
    flexDirection: "row",
    padding: 10,
    flex: 1,
  },
  players: { width: 220 },
  player: { borderWidth: 1, padding: 3, height: 36 },
  score: {
    borderWidth: 1,
    padding: 3,
    width: 36,
    height: 36,
  },
  upper: { padding: 3 },
})
