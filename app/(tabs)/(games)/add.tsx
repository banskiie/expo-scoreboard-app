import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { Option } from "@/types/all"
import { FIRESTORE_DB } from "@/firebase"
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  DocumentSnapshot,
} from "firebase/firestore"
import { useEffect, useState } from "react"
import * as ScreenOrientation from "expo-screen-orientation"
import { Dropdown } from "react-native-element-dropdown"
import { InitialGameState, GameSchema } from "@/schema/list"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, Controller } from "react-hook-form"
import { z } from "zod"
import BouncyCheckbox from "react-native-bouncy-checkbox"
import { useAuthStore } from "@/store/auth"
import React from "react"

const formats: Option[] = [
  { label: "Best of 1", value: 1 },
  { label: "Best of 3", value: 3 },
]

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
  const { user } = useAuthStore()
  const router = useRouter()
  const [categories, setCategories] = useState<Option[]>([])
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<boolean>(false)
  const { id } = useLocalSearchParams()

  useEffect(() => {
    const unsubscribe = fetchCategories(setCategories, setLoading, setError)
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT)

    return () => {
      ScreenOrientation.unlockAsync()
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (id) {
      const ref = doc(FIRESTORE_DB, "games", id as string)
      const sub = onSnapshot(ref, {
        next: (snapshot: DocumentSnapshot) => {
          if (snapshot.exists()) {
            setData(snapshot.data())
          }
        },
      })

      return () => sub()
    }
  }, [id])

  const form = useForm<z.infer<typeof GameSchema>>({
    resolver: zodResolver(GameSchema),
    values: data ?? {
      ...InitialGameState,
      details: {
        ...InitialGameState.details,
        court: user?.displayName || "",
      },
    },
  })

  const { watch } = form

  const submit = async (payload: z.infer<typeof GameSchema>) => {
    try {
      setLoading(true)
      id
        ? await updateDoc(doc(FIRESTORE_DB, "games", id as string), payload)
        : await addDoc(collection(FIRESTORE_DB, "games"), payload)
      router.back()
    } catch (error: any) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

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
          onPress={form.handleSubmit(submit)}
          style={{ ...styles.action, backgroundColor: "#fae466" }}
        >
          <Text style={{ fontWeight: "bold" }}>Submit</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.form}>
          <View style={{ ...styles.form_item }}>
            <Text
              style={{ fontWeight: 600, fontSize: 20, paddingHorizontal: 4 }}
            >
              Court
            </Text>
            <Controller
              control={form.control}
              name="details.court"
              render={({ field: { onChange, value, onBlur } }) => (
                <TextInput
                  readOnly
                  style={styles.input}
                  value={user?.displayName}
                  onBlur={onBlur}
                  keyboardType="numeric"
                />
              )}
            />
          </View>
          <View style={styles.form_item}>
            <Text
              style={{ fontWeight: 600, fontSize: 20, paddingHorizontal: 4 }}
            >
              Category
            </Text>
            <Controller
              control={form.control}
              name="details.category"
              render={({ field: { onChange, value, onBlur } }) => (
                <Dropdown
                  style={styles.input}
                  containerStyle={{ marginTop: -24, borderRadius: 12 }}
                  data={categories}
                  mode="default"
                  labelField="label"
                  valueField="value"
                  placeholder="Select Category"
                  value={value as any}
                  onChange={(item: Option) => onChange(item.value)}
                  onBlur={onBlur}
                />
              )}
            />
          </View>
          <View style={styles.form_item}>
            <Text
              style={{ fontWeight: 600, fontSize: 20, paddingHorizontal: 4 }}
            >
              Format (No. of Sets)
            </Text>
            <Controller
              control={form.control}
              name="details.no_of_sets"
              render={({ field: { onChange, value, onBlur } }) => (
                <Dropdown
                  style={styles.input}
                  containerStyle={{ marginTop: -24, borderRadius: 12 }}
                  data={formats}
                  mode="default"
                  labelField="label"
                  valueField="value"
                  placeholder="Select Format"
                  value={value as any}
                  onChange={(item: Option) => {
                    onChange(item.value)
                    const generateSet = () => ({
                      a_score: 0,
                      b_score: 0,
                      current_round: 1,
                      last_team_scored: "",
                      winner: "",
                      scoresheet: [
                        {
                          team_scored: "",
                          scored_at: "",
                          a_switch: true,
                          b_switch: true,
                          current_a_score: 0,
                          current_b_score: 0,
                          scorer: "",
                          to_serve: "",
                          next_serve: "",
                        },
                      ],
                      switch: false,
                    })
                    const sets = Array.from(
                      { length: +item.value },
                      (_, i) => ({
                        [`set_${i + 1}`]: generateSet(),
                      })
                    ).reduce((acc, cur) => ({ ...acc, ...cur }), {})

                    form.setValue("sets", sets as any)
                  }}
                  onBlur={onBlur}
                />
              )}
            />
            {form.formState.errors.details?.no_of_sets && (
              <Text style={{ color: "red" }}>
                {form.formState.errors.details.no_of_sets.message}
              </Text>
            )}
          </View>
          <View style={styles.form_item}>
            <Text
              style={{ fontWeight: 600, fontSize: 20, paddingHorizontal: 4 }}
            >
              Winning Score
            </Text>
            <Controller
              control={form.control}
              name="details.max_score"
              render={({ field: { onChange, value, onBlur } }) => (
                <TextInput
                  style={styles.input}
                  value={value.toString()}
                  onChangeText={(value) => onChange(+value)}
                  onBlur={onBlur}
                  keyboardType="numeric"
                />
              )}
            />
            {form.formState.errors.details?.max_score && (
              <Text style={{ color: "red" }}>
                {form.formState.errors.details.max_score.message}
              </Text>
            )}
          </View>
          <View style={styles.form_item}>
            <Controller
              control={form.control}
              name="details.plus_two_rule"
              render={({ field: { onChange, value, onBlur } }) => (
                <View
                  style={{
                    display: "flex",
                    flexDirection: "row",
                  }}
                >
                  <BouncyCheckbox
                    size={22}
                    fillColor="black"
                    unFillColor="#FFFFFF"
                    style={{ marginVertical: 5, marginLeft: 10 }}
                    isChecked={value}
                    iconStyle={{ borderColor: "black" }}
                    innerIconStyle={{ borderWidth: 2 }}
                    onPress={(isChecked: boolean) => {
                      onChange(isChecked)
                    }}
                  />
                  <Text
                    style={{
                      marginTop: 4,
                      fontWeight: 600,
                      fontSize: 18,
                    }}
                  >
                    Plus Two Rule?
                  </Text>
                </View>
              )}
            />
            {form.formState.errors.details?.plus_two_rule && (
              <Text style={{ color: "red" }}>
                {form.formState.errors.details.plus_two_rule.message}
              </Text>
            )}
          </View>
          {watch("details.plus_two_rule") && (
            <>
              <View
                style={{
                  display: "flex",
                  flexDirection: "row",
                }}
              >
                <BouncyCheckbox
                  size={22}
                  fillColor="black"
                  unFillColor="#FFFFFF"
                  style={{ marginVertical: 5, marginLeft: 10 }}
                  iconStyle={{ borderColor: "black" }}
                  innerIconStyle={{ borderWidth: 2 }}
                  onPress={(isChecked: boolean) => {
                    form.setValue(
                      "details.plus_two_score",
                      isChecked ? 9999 : watch("details.max_score") + 9
                    )
                  }}
                />
                <Text
                  style={{
                    marginTop: 4,
                    fontWeight: 600,
                    fontSize: 18,
                  }}
                >
                  No Limit
                </Text>
              </View>
              {watch("details.plus_two_score") < 9999 && (
                <View style={styles.form_item}>
                  <Text
                    style={{
                      fontWeight: 600,
                      fontSize: 20,
                      paddingHorizontal: 4,
                    }}
                  >
                    Final Max Score
                  </Text>
                  <Controller
                    control={form.control}
                    name="details.plus_two_score"
                    render={({ field: { onChange, value, onBlur } }) => (
                      <TextInput
                        readOnly={watch("details.plus_two_score") >= 9999}
                        style={styles.input}
                        value={value.toString()}
                        onChangeText={(value) => onChange(+value)}
                        onBlur={onBlur}
                        keyboardType="numeric"
                      />
                    )}
                  />
                  {form.formState.errors.details?.plus_two_score && (
                    <Text style={{ color: "red" }}>
                      {form.formState.errors.details.plus_two_score.message}
                    </Text>
                  )}
                </View>
              )}
              <Text style={{ textAlign: "center" }}>
                * PLUS TWO: If the score is {watch("details.max_score") - 1}-
                {watch("details.max_score") - 1}, a side must win by two clear
                points to win the game.
                {watch("details.plus_two_score") >= 9999 &&
                  `If it reaches ${watch("details.plus_two_score") - 1}-${
                    watch("details.plus_two_score") - 1
                  }, the first to get their 
                  ${watch("details.plus_two_score")} points wins.`}
              </Text>
            </>
          )}
          {!!watch("details.category") && (
            <>
              <View style={styles.form_item}>
                <View style={{ display: "flex", flexDirection: "row" }}>
                  <Text
                    style={{
                      fontWeight: 600,
                      fontSize: 20,
                      paddingHorizontal: 4,
                    }}
                  >
                    Player 1 (Team A)
                  </Text>
                  <View style={styles.form_item}>
                    <Controller
                      control={form.control}
                      name="players.team_a.player_1.use_nickname"
                      render={({ field: { onChange, value, onBlur } }) => (
                        <View
                          style={{
                            display: "flex",
                            flexDirection: "row",
                          }}
                        >
                          <BouncyCheckbox
                            size={20}
                            fillColor="black"
                            unFillColor="#FFFFFF"
                            style={{ marginVertical: 5, marginLeft: 10 }}
                            isChecked={value}
                            iconStyle={{ borderColor: "black" }}
                            innerIconStyle={{ borderWidth: 2 }}
                            onPress={(isChecked: boolean) => {
                              onChange(isChecked)
                            }}
                          />
                          <Text
                            style={{
                              marginTop: 4,
                              fontWeight: 600,
                              fontSize: 18,
                              marginLeft: -10,
                            }}
                          >
                            Use nickname?
                          </Text>
                        </View>
                      )}
                    />
                  </View>
                </View>
                {watch("players.team_a.player_1.use_nickname") ? (
                  <Controller
                    control={form.control}
                    name="players.team_a.player_1.nickname"
                    render={({ field: { onChange, value, onBlur } }) => (
                      <>
                        <Text
                          style={{
                            fontWeight: 600,
                            fontSize: 20,
                            paddingHorizontal: 4,
                            color: "#3b3b3b",
                          }}
                        >
                          Nickname
                        </Text>
                        <TextInput
                          style={styles.input}
                          value={value}
                          onChangeText={(text) => onChange(text)}
                          onBlur={onBlur}
                        />
                      </>
                    )}
                  />
                ) : (
                  <>
                    <Controller
                      control={form.control}
                      name="players.team_a.player_1.first_name"
                      render={({ field: { onChange, value, onBlur } }) => (
                        <>
                          <Text
                            style={{
                              fontWeight: 600,
                              fontSize: 20,
                              paddingHorizontal: 4,
                              color: "#3b3b3b",
                            }}
                          >
                            First Name
                          </Text>
                          <TextInput
                            style={styles.input}
                            value={value}
                            onChangeText={(text) => onChange(text)}
                            onBlur={onBlur}
                          />
                        </>
                      )}
                    />
                    {form.formState.errors.players?.team_a?.player_1
                      ?.first_name && (
                      <Text style={{ color: "red" }}>
                        {
                          form.formState.errors.players?.team_a?.player_1
                            .first_name.message
                        }
                      </Text>
                    )}
                    <Controller
                      control={form.control}
                      name="players.team_a.player_1.last_name"
                      render={({ field: { onChange, value, onBlur } }) => (
                        <>
                          <Text
                            style={{
                              fontWeight: 600,
                              fontSize: 20,
                              paddingHorizontal: 4,
                              color: "#3b3b3b",
                            }}
                          >
                            Last Name
                          </Text>
                          <TextInput
                            style={styles.input}
                            value={value}
                            onChangeText={(text) => onChange(text)}
                            onBlur={onBlur}
                          />
                        </>
                      )}
                    />
                    {form.formState.errors.players?.team_a?.player_1
                      ?.last_name && (
                      <Text style={{ color: "red" }}>
                        {
                          form.formState.errors.players?.team_a?.player_1
                            .last_name.message
                        }
                      </Text>
                    )}
                  </>
                )}
              </View>
              {watch("details.category").split(".")[1] == "doubles" && (
                <View style={styles.form_item}>
                  <View style={{ display: "flex", flexDirection: "row" }}>
                    <Text
                      style={{
                        fontWeight: 600,
                        fontSize: 20,
                        paddingHorizontal: 4,
                      }}
                    >
                      Player 2 (Team A)
                    </Text>
                    <View style={styles.form_item}>
                      <Controller
                        control={form.control}
                        name="players.team_a.player_2.use_nickname"
                        render={({ field: { onChange, value, onBlur } }) => (
                          <View
                            style={{
                              display: "flex",
                              flexDirection: "row",
                            }}
                          >
                            <BouncyCheckbox
                              size={20}
                              fillColor="black"
                              unFillColor="#FFFFFF"
                              style={{ marginVertical: 5, marginLeft: 10 }}
                              isChecked={value}
                              iconStyle={{ borderColor: "black" }}
                              innerIconStyle={{ borderWidth: 2 }}
                              onPress={(isChecked: boolean) => {
                                onChange(isChecked)
                              }}
                            />
                            <Text
                              style={{
                                marginTop: 4,
                                fontWeight: 600,
                                fontSize: 18,
                                marginLeft: -10,
                              }}
                            >
                              Use nickname?
                            </Text>
                          </View>
                        )}
                      />
                    </View>
                  </View>
                  {watch("players.team_a.player_2.use_nickname") ? (
                    <Controller
                      control={form.control}
                      name="players.team_a.player_2.nickname"
                      render={({ field: { onChange, value, onBlur } }) => (
                        <>
                          <Text
                            style={{
                              fontWeight: 600,
                              fontSize: 20,
                              paddingHorizontal: 4,
                              color: "#3b3b3b",
                            }}
                          >
                            Nickname
                          </Text>
                          <TextInput
                            style={styles.input}
                            value={value}
                            onChangeText={(text) => onChange(text)}
                            onBlur={onBlur}
                          />
                        </>
                      )}
                    />
                  ) : (
                    <>
                      <Controller
                        control={form.control}
                        name="players.team_a.player_2.first_name"
                        render={({ field: { onChange, value, onBlur } }) => (
                          <>
                            <Text
                              style={{
                                fontWeight: 600,
                                fontSize: 20,
                                paddingHorizontal: 4,
                                color: "#3b3b3b",
                              }}
                            >
                              First Name
                            </Text>
                            <TextInput
                              style={styles.input}
                              value={value}
                              onChangeText={(text) => onChange(text)}
                              onBlur={onBlur}
                            />
                          </>
                        )}
                      />
                      {form.formState.errors.players?.team_a?.player_2
                        ?.first_name && (
                        <Text style={{ color: "red" }}>
                          {
                            form.formState.errors.players?.team_a?.player_2
                              .first_name.message
                          }
                        </Text>
                      )}
                      <Controller
                        control={form.control}
                        name="players.team_a.player_2.last_name"
                        render={({ field: { onChange, value, onBlur } }) => (
                          <>
                            <Text
                              style={{
                                fontWeight: 600,
                                fontSize: 20,
                                paddingHorizontal: 4,
                                color: "#3b3b3b",
                              }}
                            >
                              Last Name
                            </Text>
                            <TextInput
                              style={styles.input}
                              value={value}
                              onChangeText={(text) => onChange(text)}
                              onBlur={onBlur}
                            />
                          </>
                        )}
                      />
                      {form.formState.errors.players?.team_a?.player_2
                        ?.last_name && (
                        <Text style={{ color: "red" }}>
                          {
                            form.formState.errors.players?.team_a?.player_2
                              .last_name.message
                          }
                        </Text>
                      )}
                    </>
                  )}
                </View>
              )}
              <View style={styles.form_item}>
                <View style={{ display: "flex", flexDirection: "row" }}>
                  <Text
                    style={{
                      fontWeight: 600,
                      fontSize: 20,
                      paddingHorizontal: 4,
                    }}
                  >
                    Player 1 (Team B)
                  </Text>
                  <View style={styles.form_item}>
                    <Controller
                      control={form.control}
                      name="players.team_b.player_1.use_nickname"
                      render={({ field: { onChange, value, onBlur } }) => (
                        <View
                          style={{
                            display: "flex",
                            flexDirection: "row",
                          }}
                        >
                          <BouncyCheckbox
                            size={20}
                            fillColor="black"
                            unFillColor="#FFFFFF"
                            style={{ marginVertical: 5, marginLeft: 10 }}
                            isChecked={value}
                            iconStyle={{ borderColor: "black" }}
                            innerIconStyle={{ borderWidth: 2 }}
                            onPress={(isChecked: boolean) => {
                              onChange(isChecked)
                            }}
                          />
                          <Text
                            style={{
                              marginTop: 4,
                              fontWeight: 600,
                              fontSize: 18,
                              marginLeft: -10,
                            }}
                          >
                            Use nickname?
                          </Text>
                        </View>
                      )}
                    />
                  </View>
                </View>
                {watch("players.team_b.player_1.use_nickname") ? (
                  <Controller
                    control={form.control}
                    name="players.team_b.player_1.nickname"
                    render={({ field: { onChange, value, onBlur } }) => (
                      <>
                        <Text
                          style={{
                            fontWeight: 600,
                            fontSize: 20,
                            paddingHorizontal: 4,
                            color: "#3b3b3b",
                          }}
                        >
                          Nickname
                        </Text>
                        <TextInput
                          style={styles.input}
                          value={value}
                          onChangeText={(text) => onChange(text)}
                          onBlur={onBlur}
                        />
                      </>
                    )}
                  />
                ) : (
                  <>
                    <Controller
                      control={form.control}
                      name="players.team_b.player_1.first_name"
                      render={({ field: { onChange, value, onBlur } }) => (
                        <>
                          <Text
                            style={{
                              fontWeight: 600,
                              fontSize: 20,
                              paddingHorizontal: 4,
                              color: "#3b3b3b",
                            }}
                          >
                            First Name
                          </Text>
                          <TextInput
                            style={styles.input}
                            value={value}
                            onChangeText={(text) => onChange(text)}
                            onBlur={onBlur}
                          />
                        </>
                      )}
                    />
                    {form.formState.errors.players?.team_b?.player_1
                      ?.first_name && (
                      <Text style={{ color: "red" }}>
                        {
                          form.formState.errors.players?.team_b?.player_1
                            .first_name.message
                        }
                      </Text>
                    )}
                    <Controller
                      control={form.control}
                      name="players.team_b.player_1.last_name"
                      render={({ field: { onChange, value, onBlur } }) => (
                        <>
                          <Text
                            style={{
                              fontWeight: 600,
                              fontSize: 20,
                              paddingHorizontal: 4,
                              color: "#3b3b3b",
                            }}
                          >
                            Last Name
                          </Text>
                          <TextInput
                            style={styles.input}
                            value={value}
                            onChangeText={(text) => onChange(text)}
                            onBlur={onBlur}
                          />
                        </>
                      )}
                    />
                    {form.formState.errors.players?.team_b?.player_1
                      ?.last_name && (
                      <Text style={{ color: "red" }}>
                        {
                          form.formState.errors.players?.team_b?.player_1
                            .last_name.message
                        }
                      </Text>
                    )}
                  </>
                )}
              </View>
              {watch("details.category").split(".")[1] == "doubles" && (
                <View style={styles.form_item}>
                  <View style={{ display: "flex", flexDirection: "row" }}>
                    <Text
                      style={{
                        fontWeight: 600,
                        fontSize: 20,
                        paddingHorizontal: 4,
                      }}
                    >
                      Player 2 (Team B)
                    </Text>
                    <View style={styles.form_item}>
                      <Controller
                        control={form.control}
                        name="players.team_b.player_2.use_nickname"
                        render={({ field: { onChange, value, onBlur } }) => (
                          <View
                            style={{
                              display: "flex",
                              flexDirection: "row",
                            }}
                          >
                            <BouncyCheckbox
                              size={20}
                              fillColor="black"
                              unFillColor="#FFFFFF"
                              style={{ marginVertical: 5, marginLeft: 10 }}
                              isChecked={value}
                              iconStyle={{ borderColor: "black" }}
                              innerIconStyle={{ borderWidth: 2 }}
                              onPress={(isChecked: boolean) => {
                                onChange(isChecked)
                              }}
                            />
                            <Text
                              style={{
                                marginTop: 4,
                                fontWeight: 600,
                                fontSize: 18,
                                marginLeft: -10,
                              }}
                            >
                              Use nickname?
                            </Text>
                          </View>
                        )}
                      />
                    </View>
                  </View>
                  {watch("players.team_b.player_2.use_nickname") ? (
                    <Controller
                      control={form.control}
                      name="players.team_b.player_2.nickname"
                      render={({ field: { onChange, value, onBlur } }) => (
                        <>
                          <Text
                            style={{
                              fontWeight: 600,
                              fontSize: 20,
                              paddingHorizontal: 4,
                              color: "#3b3b3b",
                            }}
                          >
                            Nickname
                          </Text>
                          <TextInput
                            style={styles.input}
                            value={value}
                            onChangeText={(text) => onChange(text)}
                            onBlur={onBlur}
                          />
                        </>
                      )}
                    />
                  ) : (
                    <>
                      <Controller
                        control={form.control}
                        name="players.team_b.player_2.first_name"
                        render={({ field: { onChange, value, onBlur } }) => (
                          <>
                            <Text
                              style={{
                                fontWeight: 600,
                                fontSize: 20,
                                paddingHorizontal: 4,
                                color: "#3b3b3b",
                              }}
                            >
                              First Name
                            </Text>
                            <TextInput
                              style={styles.input}
                              value={value}
                              onChangeText={(text) => onChange(text)}
                              onBlur={onBlur}
                            />
                          </>
                        )}
                      />
                      {form.formState.errors.players?.team_b?.player_2
                        ?.first_name && (
                        <Text style={{ color: "red" }}>
                          {
                            form.formState.errors.players?.team_b?.player_2
                              .first_name.message
                          }
                        </Text>
                      )}
                      <Controller
                        control={form.control}
                        name="players.team_b.player_2.last_name"
                        render={({ field: { onChange, value, onBlur } }) => (
                          <>
                            <Text
                              style={{
                                fontWeight: 600,
                                fontSize: 20,
                                paddingHorizontal: 4,
                                color: "#3b3b3b",
                              }}
                            >
                              Last Name
                            </Text>
                            <TextInput
                              style={styles.input}
                              value={value}
                              onChangeText={(text) => onChange(text)}
                              onBlur={onBlur}
                            />
                          </>
                        )}
                      />
                      {form.formState.errors.players?.team_b?.player_2
                        ?.last_name && (
                        <Text style={{ color: "red" }}>
                          {
                            form.formState.errors.players?.team_b?.player_2
                              .last_name.message
                          }
                        </Text>
                      )}
                    </>
                  )}
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 60,
  },
  input: {
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
