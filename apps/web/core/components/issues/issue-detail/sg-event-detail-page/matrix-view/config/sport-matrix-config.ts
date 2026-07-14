import type {
  MatrixSportResolution,
  SportMatrixAction,
  SportMatrixCategory,
  SportMatrixConfig,
  SportMatrixContextRule,
  SupportedMatrixSport,
} from "../types/matrix.types";

type ActionSeed = readonly [
  label: string,
  category: string,
  aliases: readonly string[],
  contextRules?: readonly SportMatrixContextRule[],
];

const contextRule = (
  sourceActions: readonly string[],
  key: string,
  values: readonly string[]
): SportMatrixContextRule => ({ sourceActions, values: { [key]: values } });

const ENTITY_DIMENSIONS = {
  team: { dimension: "team", label: "Teams", color: "#93c5fd" },
  period: { dimension: "period", label: "Periods", color: "#d8b4fe" },
  player: { dimension: "player", label: "Participants", color: "#99f6e4" },
} as const;

const toActionId = (label: string) =>
  label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const makeCategories = (values: readonly [id: string, label: string, color: string][]): SportMatrixCategory[] =>
  values.map(([id, label, color], order) => ({ id, label, color, order }));

const makeActions = (seeds: readonly ActionSeed[], categories: readonly SportMatrixCategory[]): SportMatrixAction[] => {
  const categoryColors = new Map(categories.map((category) => [category.id, category.color]));
  return seeds.map(([label, category, aliases, contextRules], order) => ({
    id: toActionId(label),
    label,
    aliases: [label, toActionId(label), ...aliases],
    category,
    color: categoryColors.get(category) ?? "#a3a3a3",
    contextRules,
    order,
    visible: true,
  }));
};

const footballCategories = makeCategories([
  ["offense", "Offense", "#93c5fd"],
  ["defense", "Defense", "#fca5a5"],
  ["special-teams", "Special Teams", "#99f6e4"],
  ["scoring", "Scoring", "#f9a8d4"],
  ["discipline", "Discipline", "#fde68a"],
]);

const cricketCategories = makeCategories([
  ["batting", "Batting", "#93c5fd"],
  ["boundary", "Boundaries", "#f9a8d4"],
  ["extras", "Extras", "#fde68a"],
  ["dismissal", "Dismissals", "#fca5a5"],
  ["control", "Match Control", "#99f6e4"],
]);

const basketballCategories = makeCategories([
  ["scoring", "Scoring", "#93c5fd"],
  ["possession", "Possession", "#99f6e4"],
  ["defense", "Defense", "#d8b4fe"],
  ["discipline", "Discipline", "#fca5a5"],
]);

const baseballCategories = makeCategories([
  ["hitting", "Hitting", "#93c5fd"],
  ["plate", "Plate Appearance", "#d8b4fe"],
  ["baserunning", "Baserunning", "#99f6e4"],
  ["defense", "Defense", "#fca5a5"],
  ["scoring", "Scoring", "#f9a8d4"],
]);

const soccerCategories = makeCategories([
  ["attack", "Attack", "#93c5fd"],
  ["possession", "Possession", "#99f6e4"],
  ["defense", "Defense", "#d8b4fe"],
  ["restart", "Restarts", "#f9a8d4"],
  ["discipline", "Discipline", "#fca5a5"],
]);

const FOOTBALL_ACTIONS = makeActions(
  [
    ["Pass Complete", "offense", ["pass_complete", "completed_pass", "complete_pass"]],
    ["Pass Incomplete", "offense", ["pass_incomplete", "incomplete_pass"]],
    ["Run", "offense", ["run", "rush", "rushing_play"]],
    ["Sack", "defense", ["sack", "qb_sack"]],
    ["Field Goal", "special-teams", ["field_goal"]],
    ["Punt", "special-teams", ["punt"]],
    ["Kickoff", "special-teams", ["kickoff", "kick_off"]],
    ["Two Point", "scoring", ["two_point", "two_point_conv", "2_point_conv", "2-point conv"]],
    ["Penalty", "discipline", ["penalty"]],
    ["Turnover", "defense", ["turnover", "possession_change"]],
    ["Interception", "defense", ["interception", "intercepted"]],
    [
      "First Down",
      "offense",
      ["first_down"],
      [
        contextRule(["pass_complete", "pass_incomplete", "interception", "run", "sack", "turnover"], "first_down", [
          "true",
        ]),
      ],
    ],
    [
      "Touchdown",
      "scoring",
      ["touchdown", "td"],
      [
        contextRule(["pass_complete", "pass_incomplete", "interception", "run", "sack", "turnover"], "touchdown", [
          "true",
        ]),
      ],
    ],
    ["Fumble", "defense", ["fumble", "fumbled"]],
    [
      "Blocked",
      "special-teams",
      ["blocked", "blocked_kick", "blocked_punt"],
      [contextRule(["field_goal", "punt", "kickoff"], "kick_result", ["blocked"])],
    ],
    ["Offside", "discipline", ["offside", "offsides"]],
    ["Holding", "discipline", ["holding"]],
  ],
  footballCategories
);

const CRICKET_ACTIONS = makeActions(
  [
    ["Dot Ball", "batting", ["dot_ball"]],
    ["Single", "batting", ["single", "one_run", "1_run"], [contextRule(["runs_scored"], "exact_runs", ["1"])]],
    ["Two Runs", "batting", ["two_runs", "2_runs"], [contextRule(["runs_scored"], "exact_runs", ["2"])]],
    ["Three Runs", "batting", ["three_runs", "3_runs"], [contextRule(["runs_scored"], "exact_runs", ["3"])]],
    ["Four", "boundary", ["four", "boundary_four"]],
    ["Six", "boundary", ["six", "boundary_six"]],
    ["Wide", "extras", ["wide"]],
    ["No Ball", "extras", ["no_ball", "noball"]],
    ["Bye", "extras", ["bye"], [contextRule(["extra"], "extra_type", ["bye"])]],
    ["Leg Bye", "extras", ["leg_bye", "legbye"], [contextRule(["extra"], "extra_type", ["leg_bye", "legbye"])]],
    ["Wicket", "dismissal", ["wicket", "out"]],
    ["Run Out", "dismissal", ["run_out", "runout"]],
    ["End Over", "control", ["end_over", "over_end"]],
    ["End Innings", "control", ["end_innings", "innings_end"]],
  ],
  cricketCategories
);

const BASKETBALL_ACTIONS = makeActions(
  [
    ["Two Point Made", "scoring", ["two_point_made", "field_goal_made_2", "made_2", "2pt_made"]],
    [
      "Two Point Missed",
      "scoring",
      ["two_point_missed", "field_goal_missed_2", "field_goal_attempt_2", "missed_2", "2pt_missed"],
    ],
    ["Three Point Made", "scoring", ["three_point_made", "field_goal_made_3", "made_3", "3pt_made"]],
    [
      "Three Point Missed",
      "scoring",
      ["three_point_missed", "field_goal_missed_3", "field_goal_attempt_3", "missed_3", "3pt_missed"],
    ],
    ["Free Throw", "scoring", ["free_throw", "free_throw_made", "free_throw_missed"]],
    ["Rebound", "possession", ["rebound", "offensive_rebound", "defensive_rebound"]],
    [
      "Assist",
      "possession",
      ["assist"],
      [contextRule(["field_goal_made_2", "field_goal_made_3"], "assisted", ["true"])],
    ],
    ["Steal", "defense", ["steal"]],
    ["Block", "defense", ["block", "blocked_shot"]],
    ["Foul", "discipline", ["foul", "personal_foul", "technical_foul"]],
    ["Turnover", "possession", ["turnover"]],
  ],
  basketballCategories
);

const BASEBALL_ACTIONS = makeActions(
  [
    ["Single", "hitting", ["single"]],
    ["Double", "hitting", ["double"]],
    ["Triple", "hitting", ["triple"]],
    ["Home Run", "scoring", ["home_run", "homerun"]],
    ["Strikeout", "plate", ["strikeout", "strike_out"]],
    ["Walk", "plate", ["walk", "base_on_balls"]],
    ["Hit by Pitch", "plate", ["hit_by_pitch", "hbp"]],
    ["Stolen Base", "baserunning", ["stolen_base", "steal_base"]],
    ["Error", "defense", ["error", "fielding_error"]],
    ["Run", "scoring", ["run", "run_scored"]],
    ["RBI", "scoring", ["rbi", "run_batted_in"]],
  ],
  baseballCategories
);

const SOCCER_ACTIONS = makeActions(
  [
    ["Goal", "attack", ["goal", "goal_scored"]],
    ["Shot", "attack", ["shot", "shot_attempt"]],
    ["Shot on Target", "attack", ["shot_on_target", "shot_target"]],
    ["Pass", "possession", ["pass", "pass_complete"]],
    ["Assist", "attack", ["assist"]],
    ["Tackle", "defense", ["tackle", "tackle_won"]],
    ["Interception", "defense", ["interception"]],
    ["Save", "defense", ["save", "goalkeeper_save"]],
    ["Corner", "restart", ["corner", "corner_kick"]],
    ["Foul", "discipline", ["foul"]],
    ["Yellow Card", "discipline", ["yellow_card", "booking"]],
    ["Red Card", "discipline", ["red_card", "sending_off"]],
    ["Offside", "discipline", ["offside"]],
  ],
  soccerCategories
);

const buildConfig = (
  sport: SupportedMatrixSport,
  label: string,
  categories: readonly SportMatrixCategory[],
  actions: readonly SportMatrixAction[],
  rowDimensionPriority: SportMatrixConfig["rowDimensionPriority"]
): SportMatrixConfig => ({
  sport,
  label,
  categories,
  actions,
  metricDimensionPriority: ["player", "team", "period"],
  rowDimensionPriority,
  entityDimensions: ENTITY_DIMENSIONS,
});

export const SUPPORTED_MATRIX_SPORTS = [
  "american-football",
  "cricket",
  "basketball",
  "baseball",
  "soccer",
] as const satisfies readonly SupportedMatrixSport[];

export const SPORT_MATRIX_CONFIGS: Readonly<Record<SupportedMatrixSport, SportMatrixConfig>> = {
  "american-football": buildConfig("american-football", "American Football", footballCategories, FOOTBALL_ACTIONS, [
    "team",
    "period",
    "player",
  ]),
  cricket: buildConfig("cricket", "Cricket", cricketCategories, CRICKET_ACTIONS, ["team", "period", "player"]),
  basketball: buildConfig("basketball", "Basketball", basketballCategories, BASKETBALL_ACTIONS, [
    "team",
    "period",
    "player",
  ]),
  baseball: buildConfig("baseball", "Baseball", baseballCategories, BASEBALL_ACTIONS, ["team", "period", "player"]),
  soccer: buildConfig("soccer", "Soccer", soccerCategories, SOCCER_ACTIONS, ["team", "period", "player"]),
};

const normalizeSportInput = (value: string | null | undefined) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const normalizeMatrixSport = (value: string | null | undefined): SupportedMatrixSport | null => {
  const normalized = normalizeSportInput(value);
  if (!normalized) return null;
  if (
    ["american-football", "americanfootball", "football", "gridiron"].includes(normalized) ||
    (normalized.includes("american") && normalized.includes("football"))
  ) {
    return "american-football";
  }
  if (normalized.includes("basketball")) return "basketball";
  if (normalized.includes("baseball")) return "baseball";
  if (normalized.includes("cricket")) return "cricket";
  if (
    ["soccer", "association-football", "associationfootball"].includes(normalized) ||
    normalized.includes("soccer") ||
    (normalized.includes("association") && normalized.includes("football"))
  ) {
    return "soccer";
  }
  return null;
};

export const getSportMatrixConfig = (value: string | null | undefined): SportMatrixConfig | null => {
  const sport = normalizeMatrixSport(value);
  return sport ? SPORT_MATRIX_CONFIGS[sport] : null;
};

export const resolveSportMatrixConfig = (value: string | null | undefined): MatrixSportResolution => {
  const input = String(value ?? "");
  const normalizedInput = normalizeSportInput(value);
  const sport = normalizeMatrixSport(value);
  return {
    input,
    normalizedInput,
    sport,
    config: sport ? SPORT_MATRIX_CONFIGS[sport] : null,
    isSupported: sport !== null,
  };
};
