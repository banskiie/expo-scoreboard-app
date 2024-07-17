import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"
import React, { useEffect, useState } from "react"
import { FIRESTORE_DB } from "@/firebase"
import { doc, onSnapshot, DocumentSnapshot } from "firebase/firestore"
import moment from "moment"

interface Card {
  title: string
  description: string
}

const Card = ({ title, description }: Card) => {
  return (
    <View>
      <Text
        style={{ fontWeight: "bold", fontSize: 18, textTransform: "uppercase" }}
      >
        {title}
      </Text>
      <Text style={{ fontSize: 18 }}>
        {description !== "" ? description : "N/A"}
      </Text>
    </View>
  )
}

const Details = ({ id }: any) => {
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
          console.log(snap)
          setData(snap)
        }
      },
    })

    return () => sub()
  }, [id])

  const fetchPlayerName = (player: string): string =>
    data?.players[`team_${player[0]}`][`player_${player[1]}`].use_nickname
      ? data?.players[`team_${player[0]}`][`player_${player[1]}`].nickname
      : `${
          data?.players[`team_${player[0]}`][`player_${player[1]}`].first_name
        } ${
          data?.players[`team_${player[0]}`][`player_${player[1]}`].last_name
        }`

  if (!data) {
    return <ActivityIndicator color="black" />
  }

  return (
    <ScrollView style={{ flex: 1 }}>
      <View style={{ padding: 10, gap: 8 }}>
        <Text
          style={{
            fontSize: 22,
            textTransform: "uppercase",
            fontWeight: 700,
          }}
        >
          Details
        </Text>
        <Card title="Category" description={data?.details.category} />
        <Card title="Court" description={data?.details.court} />
        <Card title="Game No." description={data?.details.game_no} />
        <Card title="Group No." description={data?.details.game_no} />
        <Card title="Winning Score" description={data?.details.max_score} />
        <Card title="No. of Sets" description={data?.details.no_of_sets} />
        <Card
          title="Plus two rule"
          description={data?.details.plus_two_rule ? "True" : "False"}
        />
        <Card title="Shuttles Used" description={data?.details.shuttles_used} />
        {data?.details.plus_two_rule && (
          <Card
            title="Plus two max score"
            description={data?.details.plus_two_score}
          />
        )}
        <Text
          style={{
            fontSize: 22,
            textTransform: "uppercase",
            fontWeight: 700,
          }}
        >
          Teams
        </Text>
        <Card title="A TEAM" description={data?.players.team_a.team_name} />
        <Card title="A1 Player" description={fetchPlayerName("a1")} />
        {isDoubles && (
          <Card title="A2 Player " description={fetchPlayerName("a2")} />
        )}
        <Card title="B TEAM" description={data?.players.team_b.team_name} />
        <Card title="B1 Player" description={fetchPlayerName("b1")} />
        {isDoubles && (
          <Card title="B2 Player " description={fetchPlayerName("b2")} />
        )}
        <Text
          style={{
            fontSize: 22,
            textTransform: "uppercase",
            fontWeight: 700,
          }}
        >
          Officials
        </Text>
        <Card title="Referee" description={data?.officials.referee} />
        <Card
          title="Service Judge"
          description={data?.officials.service_judge}
        />
        <Card title="Umpire" description={data?.officials.umpire} />
        <Text
          style={{
            fontSize: 22,
            textTransform: "uppercase",
            fontWeight: 700,
          }}
        >
          Specifications
        </Text>
        <Card
          title="Activity"
          description={data?.statuses.active ? "Showing on TV" : "Inactive"}
        />
        <Card title="Status" description={data?.statuses.current} />
        <Card
          title="Time Start"
          description={
            data?.time.start
              ? moment(data?.time.start.toDate()).format("LLL")
              : ""
          }
        />
        <Card
          title="Time End"
          description={
            data?.time.end ? moment(data?.time.end.toDate()).format("LLL") : ""
          }
        />
        <Card
          title="Scheduled Time"
          description={
            data?.time.slot
              ? moment(data?.time.slot.toDate()).format("LLL")
              : ""
          }
        />
      </View>
    </ScrollView>
  )
}

export default Details

const styles = StyleSheet.create({})
