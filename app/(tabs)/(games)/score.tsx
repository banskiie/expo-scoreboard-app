import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Button,
} from "react-native"
import { ReactNode, useEffect, useState } from "react"
import * as ScreenOrientation from "expo-screen-orientation"
import { Dropdown } from "react-native-element-dropdown"
import { router, useLocalSearchParams } from "expo-router"
import moment from "moment"
import { FIRESTORE_DB } from "@/firebase"
import {
  collection,
  doc,
  DocumentSnapshot,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  updateDoc,
  where,
} from "firebase/firestore"
import Entypo from "@expo/vector-icons/Entypo"
import Icon from "@expo/vector-icons/MaterialCommunityIcons"

const DISABLED_BUTTON_COLOR = "#cbcbcb"
const TEAM_A_COLOR = "#ffd3ac"
const TEAM_B_COLOR = "#adebb3"

const Score = ({ id }: any) => {
  const [duration, setDuration] = useState(moment.duration(0))
  const [loading, setLoading] = useState<boolean>(false)
  const [isChangingSet, setIsChangingSet] = useState<boolean>(false)
  const [data, setData] = useState<any>(null)
  const [isDoubles, setIsDoubles] = useState<boolean>(false)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
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

  useEffect(() => {
    let interval: any
    if (data?.time.start) {
      interval = setInterval(() => {
        const game = moment(
          data?.time.start.seconds * 1000 +
            data?.time.start.nanoseconds / 1000000
        )
        const now = moment()
        const elapsed = moment.duration(now.diff(game))
        setDuration(elapsed)
      }, 1000)
    }

    return () => clearInterval(interval)
  }, [data])

  const disablePlayerCheck = (player: string): boolean =>
    loading ||
    data?.sets[`set_${data.details.playing_set}`]?.winner !== "" ||
    !!(
      data?.sets[`set_${data.details.playing_set}`]?.scoresheet[
        data?.sets[`set_${data.details.playing_set}`]?.current_round - 1
      ]?.next_serve != player &&
      data?.sets[`set_${data.details.playing_set}`]?.scoresheet[
        data?.sets[`set_${data.details.playing_set}`]?.current_round - 1
      ]?.to_serve != player
    ) ||
    data?.sets[`set_${data.details.playing_set}`]?.scoresheet[
      data?.sets[`set_${data.details.playing_set}`]?.current_round - 1
    ]?.next_serve == ""

  const fetchPlayerName = (player: string): string =>
    data?.players[`team_${player[0]}`][`player_${player[1]}`].use_nickname
      ? data?.players[`team_${player[0]}`][`player_${player[1]}`].nickname
      : `${
          data?.players[`team_${player[0]}`][`player_${player[1]}`].first_name
        } ${
          data?.players[`team_${player[0]}`][`player_${player[1]}`].last_name
        }`

  const checkToServe = (player: string): boolean =>
    !loading &&
    !data?.sets[`set_${data.details.playing_set}`]?.winner &&
    data?.sets[`set_${data.details.playing_set}`]?.scoresheet[
      data?.sets[`set_${data.details.playing_set}`].current_round - 1
    ]?.to_serve == player

  const checkActivity = (player: string): ReactNode =>
    !!(
      !loading &&
      !data?.sets[`set_${data.details.playing_set}`]?.winner &&
      (data?.sets[`set_${data.details.playing_set}`]?.scoresheet[
        data?.sets[`set_${data.details.playing_set}`].current_round - 1
      ]?.to_serve == player ||
        data?.sets[`set_${data.details.playing_set}`]?.scoresheet[
          data?.sets[`set_${data.details.playing_set}`].current_round - 1
        ]?.next_serve == player)
    ) && (
      <Text
        style={{
          position: "absolute",
          bottom: 7,
          fontSize: 11,
          fontWeight: 600,
          textTransform: "uppercase",
          backgroundColor: "white",
          paddingHorizontal: 4,
          borderRadius: 4,
        }}
      >
        {!!(
          data?.sets[`set_${data.details.playing_set}`]?.scoresheet[
            data?.sets[`set_${data.details.playing_set}`].current_round - 1
          ]?.to_serve == player &&
          data?.sets[`set_${data.details.playing_set}`]?.scoresheet[
            data?.sets[`set_${data.details.playing_set}`].current_round - 1
          ]?.to_serve ==
            data?.sets[`set_${data.details.playing_set}`]?.scoresheet[
              data?.sets[`set_${data.details.playing_set}`].current_round - 2
            ]?.to_serve
        )
          ? "Continue Serving"
          : data?.sets[`set_${data.details.playing_set}`]?.scoresheet[
              data?.sets[`set_${data.details.playing_set}`].current_round - 1
            ]?.to_serve == player
          ? "To Serve"
          : data?.sets[`set_${data.details.playing_set}`]?.scoresheet[
              data?.sets[`set_${data.details.playing_set}`].current_round - 1
            ]?.next_serve == player
          ? "Service Over"
          : ""}
      </Text>
    )

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

  const detectWinner = (
    a_score: number,
    b_score: number,
    winning_score: number,
    plus_two_rule: boolean,
    max_score: number
  ) => {
    switch (plus_two_rule) {
      case true:
        if (
          a_score === max_score ||
          (a_score >= winning_score && a_score - b_score >= 2)
        ) {
          return "a"
        } else if (
          b_score === max_score ||
          (b_score >= winning_score && b_score - a_score >= 2)
        ) {
          return "b"
        }
        break
      case false:
        if (a_score >= winning_score) {
          return "a"
        } else if (b_score >= winning_score) {
          return "b"
        }
        break
    }
    return ""
  }

  const changeSet = async (value: number) => {
    setIsChangingSet(true)
    try {
      await updateDoc(ref, {
        details: { ...data.details, playing_set: value },
      })
    } catch (error: any) {
      console.error(error)
    } finally {
      setIsChangingSet(false)
    }
  }

  const next = (next_serve: string, scorer: string, prev_server: string) => {
    const team = scorer[0]
    const prev_team = prev_server[0]
    if (prev_server) {
      if (team != prev_team) {
        return isDoubles
          ? prev_server[0] + (prev_server[1] == "1" ? "2" : "1")
          : prev_server
      } else if (team == prev_team) {
        return next_serve
      }
    } else {
      return ""
    }
  }

  const checkTeamASwitch = (score: number, scorer: string, scoresheet: any) => {
    switch (score) {
      case 0:
        switch (scorer) {
          case "a1":
            return false
          case "a2":
            return true
        }
        break
      case 1:
        switch (scorer) {
          case "a1":
            return true
          case "a2":
            return false
        }
        break
      default:
        if (scoresheet[scoresheet.length - 1].team_scored != scorer[0]) {
          return scoresheet[scoresheet.length - 1].a_switch
        } else {
          return !scoresheet[scoresheet.length - 1].a_switch
        }
    }
  }

  const checkTeamBSwitch = (score: number, scorer: string, scoresheet: any) => {
    switch (score) {
      case 0:
        switch (scorer) {
          case "b1":
            return false
          case "b2":
            return true
        }
        break
      case 1:
        switch (scorer) {
          case "b1":
            return true
          case "b2":
            return false
        }
        break
      default:
        if (scoresheet[scoresheet.length - 1].team_scored != scorer[0]) {
          return scoresheet[scoresheet.length - 1].b_switch
        } else {
          return !scoresheet[scoresheet.length - 1].b_switch
        }
    }
  }

  const start = async () => {
    setLoading(true)
    try {
      await runTransaction(FIRESTORE_DB, async (transaction) => {
        const currentDoc = await getDoc(ref)
        if (currentDoc.exists()) {
          const data = currentDoc.data()

          transaction.update(ref, {
            ...data,
            statuses: {
              ...data.statuses,
              active: true,
              current: "current",
              focus: Date.now(),
            },
            time: {
              ...data.time,
              start: moment().toDate(),
            },
          })
        }

        // Update court status to active
        const courtRef = doc(FIRESTORE_DB, "courts", data.details.court)
        const courtDoc = await getDoc(courtRef)
        if (courtDoc.exists()) {
          transaction.update(courtRef, { active: true })
        }
      })
    } catch (error: any) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const score = async (scorer: string) => {
    setLoading(true)
    try {
      const current = `set_${data?.details.playing_set}`
      const updatedScoreSheet = data?.sets[current].scoresheet
      const team = scorer[0]

      const new_a_score = (team == "a" ? 1 : 0) + data?.sets[current].a_score
      const new_b_score = (team == "b" ? 1 : 0) + data?.sets[current].b_score

      updatedScoreSheet[data?.sets[current].current_round] = {
        team_scored: team,
        scored_at: Date.now(),
        current_a_score: new_a_score,
        current_b_score: new_b_score,
        scorer: scorer,
        to_serve: scorer,
        a_switch:
          team == "a"
            ? checkTeamASwitch(new_a_score, scorer, updatedScoreSheet)
            : data?.sets[current].scoresheet[
                data?.sets[current].scoresheet.length - 1
              ].a_switch,
        b_switch:
          team == "b"
            ? checkTeamBSwitch(new_b_score, scorer, updatedScoreSheet)
            : data?.sets[current].scoresheet[
                data?.sets[current].scoresheet.length - 1
              ].b_switch,
        next_serve: next(
          updatedScoreSheet[data?.sets[current].current_round - 1].next_serve,
          scorer,
          updatedScoreSheet[data?.sets[current].current_round - 1].to_serve
        ),
      }

      switch (team) {
        case "a":
          await updateDoc(ref, {
            sets: {
              ...data?.sets,
              [`set_${data?.details.playing_set}`]: {
                ...data?.sets[current],
                current_round: data?.sets[current].current_round + 1,
                a_score: data?.sets[current].a_score + 1,
                scoresheet: [...updatedScoreSheet],
                last_team_scored: team,
                winner: detectWinner(
                  data?.sets[current].a_score + 1,
                  data?.sets[current].b_score,
                  data?.details.max_score,
                  data?.details.plus_two_rule,
                  data?.details.plus_two_score
                ),
              },
            },
            statuses: {
              ...data?.statuses,
              focus: Date.now(),
            },
          })
          break
        case "b":
          await updateDoc(ref, {
            sets: {
              ...data?.sets,
              [`set_${data?.details.playing_set}`]: {
                ...data?.sets[current],
                current_round: data?.sets[current].current_round + 1,
                b_score: data?.sets[current].b_score + 1,
                scoresheet: [...updatedScoreSheet],
                last_team_scored: team,
                winner: detectWinner(
                  data?.sets[current].a_score,
                  data?.sets[current].b_score + 1,
                  data?.details.max_score,
                  data?.details.plus_two_rule,
                  data?.details.plus_two_score
                ),
              },
            },
            statuses: {
              ...data?.statuses,
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

  const undo = async () => {
    try {
      setLoading(true)
      const current = `set_${data?.details.playing_set}`
      const currentRow = data?.sets[current].scoresheet.length - 1
      const currentTeamScored =
        data?.sets[current].scoresheet[currentRow].team_scored
      const updatedScoreSheet = data?.sets[current].scoresheet
      updatedScoreSheet.pop()

      switch (currentTeamScored) {
        case "a":
          await updateDoc(ref, {
            sets: {
              ...data?.sets,
              [`set_${data?.details.playing_set}`]: {
                ...data?.sets[current],
                current_round: data?.sets[current].current_round - 1,
                a_score: data?.sets[current].a_score - 1,
                scoresheet: [...updatedScoreSheet],
                last_team_scored:
                  updatedScoreSheet.length > 1
                    ? updatedScoreSheet[updatedScoreSheet.length - 1]
                        .team_scored
                    : "",
                winner: "",
              },
            },
            statuses: {
              ...data?.statuses,
              focus: Date.now(),
            },
          })
          break
        case "b":
          await updateDoc(ref, {
            sets: {
              ...data?.sets,
              [`set_${data?.details.playing_set}`]: {
                ...data?.sets[current],
                current_round: data?.sets[current].current_round - 1,
                b_score: data?.sets[current].b_score - 1,
                scoresheet: [...updatedScoreSheet],
                last_team_scored:
                  updatedScoreSheet.length > 1
                    ? updatedScoreSheet[updatedScoreSheet.length - 1]
                        .team_scored
                    : "",
                winner: "",
              },
            },
            statuses: {
              ...data?.statuses,
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

  const updateInitialServer = async (server: string) => {
    setLoading(true)
    try {
      const current = `set_${data.details.playing_set}`
      const updatedScoreSheet = data.sets[current].scoresheet
      const team = server[0]

      updatedScoreSheet[0] = {
        ...data.sets[current].scoresheet[0],
        to_serve: server,
        a_switch:
          team == "a"
            ? checkTeamASwitch(0, server, updatedScoreSheet)
            : data.sets[current].scoresheet[
                data.sets[current].scoresheet.length - 1
              ].a_switch,
        b_switch:
          team == "b"
            ? checkTeamBSwitch(0, server, updatedScoreSheet)
            : data.sets[current].scoresheet[
                data.sets[current].scoresheet.length - 1
              ].b_switch,
      }

      await updateDoc(ref, {
        sets: {
          ...data.sets,
          [`set_${data.details.playing_set}`]: {
            ...data.sets[current],
            scoresheet: [...updatedScoreSheet],
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

  const updateInitialReceiver = async (receiver: string) => {
    setLoading(true)
    try {
      const current = `set_${data.details.playing_set}`
      const updatedScoreSheet = data.sets[current].scoresheet
      const team = receiver[0]
      let next_server

      switch (receiver) {
        case "a1":
          next_server = "a2"
          break
        case "a2":
          next_server = "a1"
          break
        case "b1":
          next_server = "b2"
          break
        case "b2":
          next_server = "b1"
          break
      }

      updatedScoreSheet[0] = {
        ...data.sets[current].scoresheet[0],
        a_switch:
          team == "a"
            ? checkTeamASwitch(0, receiver, updatedScoreSheet)
            : data.sets[current].scoresheet[
                data.sets[current].scoresheet.length - 1
              ].a_switch,
        b_switch:
          team == "b"
            ? checkTeamBSwitch(0, receiver, updatedScoreSheet)
            : data.sets[current].scoresheet[
                data.sets[current].scoresheet.length - 1
              ].b_switch,
        next_serve: next_server,
      }

      await updateDoc(ref, {
        sets: {
          ...data.sets,
          [`set_${data.details.playing_set}`]: {
            ...data.sets[current],
            scoresheet: [...updatedScoreSheet],
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

  if (!data) {
    return <ActivityIndicator />
  }

  return (
    <View style={styles.page_container}>
      <TouchableOpacity
        style={{
          display: isPlaying ? "none" : "flex",
          ...styles.start,
        }}
        onPress={start}
      >
        <Entypo
          name="controller-play"
          size={120}
          color="black"
          style={{ paddingLeft: 15 }}
        />
      </TouchableOpacity>
      <View
        style={{ ...styles.score_header, display: isPlaying ? "flex" : "none" }}
      >
        <View
          style={{ ...styles.actions, justifyContent: "flex-start", gap: 5 }}
        >
          <TouchableOpacity
            style={{
              ...styles.action_button,
              backgroundColor: "#c4c4c4",
            }}
            onPress={() => router.back()}
          >
            <Text
              style={{
                textAlign: "center",
                textTransform: "uppercase",
                fontWeight: 800,
              }}
            >
              Go back
            </Text>
          </TouchableOpacity>
          <Dropdown
            style={styles.set_dropdown}
            selectedTextStyle={{ fontWeight: 800 }}
            containerStyle={{ marginTop: -22, borderRadius: 6 }}
            data={Array.from({
              length:
                Object.values(data?.sets).filter(
                  (set: any) => set.winner === "a"
                ).length === 2 ||
                Object.values(data?.sets).filter(
                  (set: any) => set.winner === "b"
                ).length === 2
                  ? Object.values(data?.sets).filter((set: any) => set.winner)
                      .length
                  : Object.values(data?.sets).filter((set: any) => set.winner)
                      .length + 1,
            }).map((_, index) => ({
              label: `SET ${index + 1}`,
              value: index + 1,
            }))}
            value={data?.details.playing_set ?? ""}
            mode="default"
            labelField="label"
            valueField="value"
            placeholder="Select Set"
            onChange={(item: any) => changeSet(item.value)}
          />
        </View>
        <View style={styles.timer_container}>
          <Text
            style={{
              marginTop: -6,
              fontWeight: 600,
              fontSize: 32,
              color: "yellow",
            }}
          >
            {!!(
              duration.seconds() == 0 &&
              duration.hours() == 0 &&
              duration.minutes() == 0
            )
              ? "00:00:00"
              : `${
                  duration.hours() > 0
                    ? duration.hours().toString().padStart(2, "0") + ":"
                    : "00:"
                }${duration.minutes().toString().padStart(2, "0")}:${duration
                  .seconds()
                  .toString()
                  .padStart(2, "0")}`}
          </Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            disabled={loading}
            style={{
              ...styles.action_button,
              backgroundColor: loading ? DISABLED_BUTTON_COLOR : "#e0afff",
            }}
            onPress={reset}
          >
            <Entypo name="cycle" size={14} color="black" />
            <Text
              style={{
                textAlign: "center",
                textTransform: "uppercase",
                fontWeight: 800,
              }}
            >
              Reset
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={loading || !isPlaying}
            style={{
              ...styles.action_button,
              backgroundColor:
                loading || !isPlaying
                  ? DISABLED_BUTTON_COLOR
                  : data?.statuses.active
                  ? "#c2b067"
                  : "#ffffc5",
            }}
            onPress={scoreboard}
          >
            {data?.statuses.active ? (
              <Entypo name="eye-with-line" size={14} color="black" />
            ) : (
              <Entypo name="eye" size={14} color="black" />
            )}
            <Text
              style={{
                textAlign: "center",
                textTransform: "uppercase",
                fontWeight: 800,
              }}
            >
              {data?.statuses.active ? "Hide" : "Show"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={
              loading ||
              !(
                (data?.details.no_of_sets === 1 &&
                  data.sets[`set_${data.details.playing_set}`].winner) ||
                (data?.details.no_of_sets === 3 &&
                  (Object.values(data.sets).filter(
                    (set: any) => set.winner == "a"
                  ).length == 2 ||
                    Object.values(data.sets).filter(
                      (set: any) => set.winner == "b"
                    ).length == 2))
              )
            }
            style={{
              ...styles.action_button,
              backgroundColor:
                loading ||
                !(
                  (data?.details.no_of_sets === 1 &&
                    data.sets[`set_${data.details.playing_set}`].winner) ||
                  (data?.details.no_of_sets === 3 &&
                    (Object.values(data.sets).filter(
                      (set: any) => set.winner == "a"
                    ).length == 2 ||
                      Object.values(data.sets).filter(
                        (set: any) => set.winner == "b"
                      ).length == 2))
                )
                  ? DISABLED_BUTTON_COLOR
                  : "#b5c7eb",
            }}
          >
            <Entypo name="flag" size={13} color="black" />
            <Text
              style={{
                textAlign: "center",
                textTransform: "uppercase",
                fontWeight: 800,
              }}
            >
              Finish
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={
              loading ||
              (data?.sets[`set_${data?.details.playing_set}`].a_score == 0 &&
                data?.sets[`set_${data?.details.playing_set}`].b_score == 0)
            }
            style={{
              ...styles.action_button,
              backgroundColor:
                loading ||
                (data?.sets[`set_${data?.details.playing_set}`].a_score == 0 &&
                  data?.sets[`set_${data?.details.playing_set}`].b_score == 0)
                  ? DISABLED_BUTTON_COLOR
                  : "pink",
            }}
            onPress={undo}
          >
            <Entypo name="triangle-left" size={15} color="black" />
            <Text
              style={{
                textAlign: "center",
                textTransform: "uppercase",
                fontWeight: 800,
              }}
            >
              Undo
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <View
        style={{
          flexDirection: "row",
          height: isPlaying ? "70%" : "100%",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isPlaying &&
          data.sets[`set_${data.details.playing_set}`].scoresheet[0].to_serve ==
            "" && (
            <View
              style={{
                position: "absolute",
                zIndex: 100,
                backgroundColor: "white",
                elevation: 5,
                width: 240,
                padding: 12,
                borderRadius: 50,
              }}
            >
              <Text
                style={{
                  fontSize: 32,
                  textAlign: "center",
                  fontWeight: 900,
                  textTransform: "uppercase",
                }}
              >
                select server
              </Text>
            </View>
          )}
        {isPlaying &&
          data.sets[`set_${data.details.playing_set}`].scoresheet[0].to_serve !=
            "" &&
          data.sets[`set_${data.details.playing_set}`].scoresheet[0]
            .next_serve == "" && (
            <View
              style={{
                position: "absolute",
                zIndex: 100,
                backgroundColor: "white",
                elevation: 5,
                width: 240,
                padding: 12,
                borderRadius: 50,
              }}
            >
              <Text
                style={{
                  fontSize: 32,
                  textAlign: "center",
                  fontWeight: 900,
                  textTransform: "uppercase",
                }}
              >
                select receiver
              </Text>
            </View>
          )}
        <View
          style={{
            ...styles.team_score_container,
            backgroundColor: TEAM_A_COLOR,
          }}
        >
          <Text style={{ fontSize: 32, fontWeight: 900, marginBottom: -36 }}>
            <Text>
              {data?.sets[`set_${data?.details.playing_set}`].winner == "a" &&
                "👑"}
            </Text>
            {!!data?.players.team_a.team_name
              ? data?.players.team_a.team_name
              : "Team A"}
          </Text>
          <Text style={{ fontSize: 140, fontWeight: 900 }}>
            {data?.sets[`set_${data?.details.playing_set}`].a_score}
          </Text>
        </View>
        <View
          style={{
            ...styles.team_score_container,
            backgroundColor: TEAM_B_COLOR,
          }}
        >
          <Text style={{ fontSize: 32, fontWeight: 900, marginBottom: -36 }}>
            <Text>
              {data?.sets[`set_${data?.details.playing_set}`].winner == "b" &&
                "👑"}
            </Text>
            {!!data?.players.team_b.team_name
              ? data?.players.team_b.team_name
              : "Team B"}
          </Text>
          <Text style={{ fontSize: 140, fontWeight: 900 }}>
            {data?.sets[`set_${data?.details.playing_set}`].b_score}
          </Text>
        </View>
      </View>

      <View
        style={{
          ...styles.bottom_tabs,
          display: isPlaying ? "flex" : "none",
          flexDirection: data.sets[`set_${data.details.playing_set}`].switch
            ? "row-reverse"
            : "row",
        }}
      >
        {/* Server Receiver Prompt */}
        {!!(
          data.sets[`set_${data.details.playing_set}`].a_score == 0 &&
          data.sets[`set_${data.details.playing_set}`].b_score == 0 &&
          data.sets[`set_${data.details.playing_set}`].scoresheet[0]
            .next_serve == ""
        ) && (
          <>
            <View style={styles.sr_container}>
              <View style={styles.sr_team}>
                {data.sets[`set_${data.details.playing_set}`].scoresheet[0]
                  .to_serve[0] != "a" && (
                  <>
                    <TouchableOpacity
                      style={styles.sr_button}
                      onPress={
                        data.sets[`set_${data.details.playing_set}`]
                          .scoresheet[0].to_serve == ""
                          ? () => updateInitialServer("a1")
                          : () => updateInitialReceiver("a1")
                      }
                    >
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: 900,
                          textTransform: "uppercase",
                        }}
                      >
                        {data.sets[`set_${data.details.playing_set}`]
                          .scoresheet[0].to_serve == ""
                          ? "Server"
                          : "Receiver"}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.sr_button}
                      onPress={
                        data.sets[`set_${data.details.playing_set}`]
                          .scoresheet[0].to_serve == ""
                          ? () => updateInitialServer("a2")
                          : () => updateInitialReceiver("a2")
                      }
                    >
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: 900,
                          textTransform: "uppercase",
                        }}
                      >
                        {data.sets[`set_${data.details.playing_set}`]
                          .scoresheet[0].to_serve == ""
                          ? "Server"
                          : "Receiver"}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
              <View style={styles.sr_team}>
                {data.sets[`set_${data.details.playing_set}`].scoresheet[0]
                  .to_serve[0] != "b" && (
                  <>
                    <TouchableOpacity
                      style={styles.sr_button}
                      onPress={
                        data.sets[`set_${data.details.playing_set}`]
                          .scoresheet[0].to_serve == ""
                          ? () => updateInitialServer("b1")
                          : () => updateInitialReceiver("b1")
                      }
                    >
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: 900,
                          textTransform: "uppercase",
                        }}
                      >
                        {data.sets[`set_${data.details.playing_set}`]
                          .scoresheet[0].to_serve == ""
                          ? "Server"
                          : "Receiver"}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.sr_button}
                      onPress={
                        data.sets[`set_${data.details.playing_set}`]
                          .scoresheet[0].to_serve == ""
                          ? () => updateInitialServer("b2")
                          : () => updateInitialReceiver("b2")
                      }
                    >
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: 900,
                          textTransform: "uppercase",
                        }}
                      >
                        {data.sets[`set_${data.details.playing_set}`]
                          .scoresheet[0].to_serve == ""
                          ? "Server"
                          : "Receiver"}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </>
        )}
        {/* TEAM A */}
        <View
          style={{
            ...styles.team,
            flexDirection: data?.sets[`set_${data.details.playing_set}`]
              .scoresheet[
              data.sets[`set_${data.details.playing_set}`].scoresheet.length - 1
            ].a_switch
              ? "row"
              : "row-reverse",
          }}
        >
          <TouchableOpacity
            style={{
              ...styles.player,
              width: isDoubles ? "47.5%" : "95%",
              backgroundColor: disablePlayerCheck("a1")
                ? DISABLED_BUTTON_COLOR
                : TEAM_A_COLOR,
            }}
            disabled={disablePlayerCheck("a1")}
            onPress={() => score("a1")}
          >
            <Text
              style={{
                position: "absolute",
                left: 18,
                fontSize: 20,
              }}
            >
              {data?.sets[`set_${data.details.playing_set}`].scoresheet[
                data.sets[`set_${data.details.playing_set}`].scoresheet.length -
                  1
              ].a_switch
                ? "L"
                : "R"}
            </Text>
            <Text style={{ fontSize: 20, fontWeight: 700 }}>
              {fetchPlayerName("a1")}
            </Text>
            {checkActivity("a1")}
            {checkToServe("a1") && (
              <Icon
                style={{
                  position: "absolute",
                  right: 18,
                  fontSize: 20,
                }}
                name="badminton"
                size={20}
                color="black"
              />
            )}
          </TouchableOpacity>
          {isDoubles && (
            <TouchableOpacity
              style={{
                ...styles.player,
                width: isDoubles ? "47.5%" : "95%",
                backgroundColor: disablePlayerCheck("a2")
                  ? DISABLED_BUTTON_COLOR
                  : TEAM_A_COLOR,
              }}
              disabled={disablePlayerCheck("a2")}
              onPress={() => score("a2")}
            >
              <Text
                style={{
                  position: "absolute",
                  left: 18,
                  fontSize: 20,
                }}
              >
                {data?.sets[`set_${data.details.playing_set}`].scoresheet[
                  data.sets[`set_${data.details.playing_set}`].scoresheet
                    .length - 1
                ].a_switch
                  ? "R"
                  : "L"}
              </Text>
              <Text style={{ fontSize: 20, fontWeight: 700 }}>
                {fetchPlayerName("a2")}
              </Text>
              {checkActivity("a2")}
              {checkToServe("a2") && (
                <Icon
                  style={{
                    position: "absolute",
                    right: 18,
                    fontSize: 20,
                  }}
                  name="badminton"
                  size={20}
                  color="black"
                />
              )}
            </TouchableOpacity>
          )}
        </View>
        {/* TEAM B */}
        <View
          style={{
            ...styles.team,
            flexDirection: data?.sets[`set_${data.details.playing_set}`]
              .scoresheet[
              data.sets[`set_${data.details.playing_set}`].scoresheet.length - 1
            ].b_switch
              ? "row"
              : "row-reverse",
          }}
        >
          <TouchableOpacity
            style={{
              ...styles.player,
              width: isDoubles ? "47.5%" : "95%",
              backgroundColor: disablePlayerCheck("b1")
                ? DISABLED_BUTTON_COLOR
                : TEAM_B_COLOR,
            }}
            disabled={disablePlayerCheck("b1")}
            onPress={() => score("b1")}
          >
            <Text
              style={{
                position: "absolute",
                left: 18,
                fontSize: 20,
              }}
            >
              {data?.sets[`set_${data.details.playing_set}`].scoresheet[
                data.sets[`set_${data.details.playing_set}`].scoresheet.length -
                  1
              ].b_switch
                ? "L"
                : "R"}
            </Text>
            <Text style={{ fontSize: 20, fontWeight: 700 }}>
              {fetchPlayerName("b1")}
            </Text>
            {checkActivity("b1")}
            {checkToServe("b1") && (
              <Icon
                style={{
                  position: "absolute",
                  right: 18,
                  fontSize: 20,
                }}
                name="badminton"
                size={20}
                color="black"
              />
            )}
          </TouchableOpacity>
          {isDoubles && (
            <TouchableOpacity
              style={{
                ...styles.player,
                width: isDoubles ? "47.5%" : "95%",
                backgroundColor: disablePlayerCheck("b2")
                  ? DISABLED_BUTTON_COLOR
                  : TEAM_B_COLOR,
              }}
              disabled={disablePlayerCheck("b2")}
              onPress={() => score("b2")}
            >
              <Text
                style={{
                  position: "absolute",
                  left: 18,
                  fontSize: 20,
                }}
              >
                {data?.sets[`set_${data.details.playing_set}`].scoresheet[
                  data.sets[`set_${data.details.playing_set}`].scoresheet
                    .length - 1
                ].b_switch
                  ? "R"
                  : "L"}
              </Text>
              <Text style={{ fontSize: 20, fontWeight: 700 }}>
                {fetchPlayerName("b2")}
              </Text>
              {checkActivity("b2")}
              {checkToServe("b2") && (
                <Icon
                  style={{
                    position: "absolute",
                    right: 18,
                    fontSize: 20,
                  }}
                  name="badminton"
                  size={20}
                  color="black"
                />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  )
}

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

  return (
    <View style={styles.settings_container}>
      <TouchableOpacity
        style={{
          ...styles.setting_button,
          backgroundColor: "#bdddfc", //BLUE GRAY NEUTRAL FIGMA
        }}
      >
        <Text
          style={{ fontSize: 20, fontWeight: 700, textTransform: "uppercase" }}
        >
          Show/Hide Scoreboard
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{
          ...styles.setting_button,
          backgroundColor: "#a8dcab",
        }}
      >
        <Text
          style={{ fontSize: 20, fontWeight: 700, textTransform: "uppercase" }}
        >
          Edit Game
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{
          ...styles.setting_button,
          backgroundColor: "#ffc067",
        }}
      >
        <Text
          style={{ fontSize: 20, fontWeight: 700, textTransform: "uppercase" }}
        >
          Focus Game
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{
          ...styles.setting_button,
          backgroundColor: "#ffee8c",
        }}
      >
        <Text
          style={{ fontSize: 20, fontWeight: 700, textTransform: "uppercase" }}
        >
          Switch Side
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{
          ...styles.setting_button,
          backgroundColor: "#e491a6",
        }}
        onPress={reset}
      >
        {loading ? (
          <ActivityIndicator />
        ) : (
          <Text
            style={{
              fontSize: 24,
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            Reset Set
          </Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={{
          ...styles.setting_button,
          backgroundColor: "#ccccff",
        }}
      >
        <Text
          style={{ fontSize: 20, fontWeight: 700, textTransform: "uppercase" }}
        >
          Force Win Set
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const Scoresheet = ({ id }: any) => {
  return <Text>Scoresheet</Text>
}

const Details = ({ id }: any) => {
  return <Text>Ivan</Text>
}

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
  bottom_tabs: {
    height: "20%",
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-around",
    alignItems: "flex-start",
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
  player_button_text: { textTransform: "uppercase", fontWeight: "bold" },
  page_container: {
    height: "100%",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  score_header: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    width: "100%",
    height: "10%",
    padding: 6,
    zIndex: 1,
  },
  set_dropdown: {
    backgroundColor: "white",
    width: "40%",
    height: "100%",
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: "gray",
  },
  timer_container: {
    width: "15%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3d3d3d",
    borderRadius: 6,
  },
  team: {
    width: "50%",
    height: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  player: {
    height: "80%",
    alignItems: "center",
    justifyContent: "center",
    borderColor: "gray",
    borderRadius: 8,
  },
  actions: {
    width: "42.5%",
    height: "100%",
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
  },
  action_button: {
    width: "20%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    flexDirection: "row",
    gap: 4,
  },
  team_score_container: {
    width: "50%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
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
  start: {
    position: "absolute",
    zIndex: 100,
    backgroundColor: "white",
    height: 180,
    width: 180,
    borderRadius: 90,
    alignItems: "center",
    justifyContent: "center",
    elevation: 10,
  },
  sr_container: {
    position: "absolute",
    width: "100%",
    marginTop: -45,
    flexDirection: "row",
  },
  sr_team: {
    width: "50%",
    flexDirection: "row",
    justifyContent: "space-around",
  },
  sr_button: {
    backgroundColor: "white",
    width: "40%",
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    borderRadius: 6,
  },
})
