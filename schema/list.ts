import { z } from "zod"
import { useAuthStore } from "@/store/auth"

const RoundSchema = z.object({
  current_a_score: z.number(),
  current_b_score: z.number(),
  scorer: z.string().optional(),
  team_scored: z.string().optional(),
  scored_at: z.string().optional(),
  to_serve: z.string(),
  next_serve: z.string(),
  a_switch: z.boolean(),
  b_switch: z.boolean(),
})

const SetSchema = z.object({
  a_score: z.number(),
  b_score: z.number(),
  current_round: z.number(),
  last_team_scored: z.string(),
  winner: z.string(),
  scoresheet: z.array(RoundSchema),
  switch: z.boolean(),
})

const SetsSchema = z.object({
  set_1: SetSchema,
  set_2: SetSchema.optional(),
  set_3: SetSchema.optional(),
})

const DetailsSchema = z.object({
  created_date: z.any(),
  game_no: z.string(),
  court: z.string(),
  category: z.any(),
  group_no: z.string(),
  no_of_sets: z.union([z.literal(1), z.literal(3)]),
  max_score: z.number(),
  game_winner: z.string(),
  shuttles_used: z.number(),
  playing_set: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  plus_two_rule: z.boolean(),
  plus_two_score: z.number(),
})

const TimeSchema = z.object({
  slot: z.any(),
  start: z.any(),
  end: z.any(),
})

const PlayerSchema = z.object({
  first_name: z.string(),
  last_name: z.string(),
  nickname: z.string().optional(),
  use_nickname: z.boolean(),
})

const TeamSchema = z.object({
  team_name: z.string().optional(),
  player_1: PlayerSchema,
  player_2: PlayerSchema,
})

const PlayersSchema = z.object({
  team_a: TeamSchema,
  team_b: TeamSchema,
})

const OfficialsSchema = z.object({
  umpire: z.string(),
  referee: z.string(),
  service_judge: z.string().optional(),
})

const StatusesSchema = z.object({
  current: z.enum(["upcoming", "current", "forfeit", "no match", "finished"]),
  active: z.boolean(),
  focus: z.any().optional(),
})

export const GameSchema = z.object({
  details: DetailsSchema,
  sets: SetsSchema,
  time: TimeSchema,
  players: PlayersSchema,
  officials: OfficialsSchema,
  statuses: StatusesSchema,
})

export const InitialGameState = GameSchema.parse({
  details: {
    created_date: Date.now(),
    game_no: "",
    court: useAuthStore.getState().user?.displayName ?? "",
    category: "",
    group_no: "",
    no_of_sets: 1,
    max_score: 21,
    game_winner: "",
    shuttles_used: 0,
    playing_set: 1,
    plus_two_rule: false,
    plus_two_score: 30,
  },
  sets: {
    set_1: {
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
    },
  },
  time: {
    slot: "",
    start: "",
    end: "",
  },
  players: {
    team_a: {
      team_name: "",
      player_1: {
        first_name: "",
        last_name: "",
        nickname: "",
        use_nickname: true,
      },
      player_2: {
        first_name: "",
        last_name: "",
        nickname: "",
        use_nickname: true,
      },
    },
    team_b: {
      team_name: "",
      player_1: {
        first_name: "",
        last_name: "",
        nickname: "",
        use_nickname: true,
      },
      player_2: {
        first_name: "",
        last_name: "",
        nickname: "",
        use_nickname: true,
      },
    },
  },
  officials: {
    umpire: "",
    service_judge: "",
    referee: "",
  },
  statuses: {
    current: "upcoming",
    active: false,
    focus: Date.now(),
  },
})
