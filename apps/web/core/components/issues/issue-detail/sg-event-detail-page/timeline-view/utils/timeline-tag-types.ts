import type { SgTagRow, SportTableKind } from "../../types";

export type TimelineTagTypeSource = "catalog" | "observed";

export type TimelineTagTypeOption = {
  color: string;
  defaultVisible: boolean;
  group: string;
  key: string;
  label: string;
  matchCount: number;
  order: number;
  source: TimelineTagTypeSource;
};

type TimelineTagTypeDefinition = {
  color: string;
  defaultVisible: boolean;
  group: string;
  key: string;
  keywords: string[];
  label: string;
  order: number;
};

type ObservedTagTypeGroup = {
  group: string;
  order: number;
};

type BuildTimelineTagTypeOptionsArgs = {
  getObservedGroup?: (row: SgTagRow) => ObservedTagTypeGroup;
};

export const MARKER_COLORS = ["#ef4444", "#22c55e", "#c084fc", "#fbbf24", "#f472b6", "#60a5fa", "#f59e0b", "#a3e635"];

const EMPTY_TIMELINE_VALUES = new Set(["", "--", "\u2014", "n/a", "na", "none", "null", "undefined"]);
const OBSERVED_TAG_GROUP = "Observed tags";
const OBSERVED_TAG_ORDER = 1000;

const FOOTBALL_TAG_TYPE_DEFINITIONS: TimelineTagTypeDefinition[] = [
  {
    color: "#7AACD0",
    defaultVisible: true,
    group: "Play call",
    key: "passComplete",
    keywords: ["pass complete", "completed pass", "completion"],
    label: "Pass complete",
    order: 0,
  },
  {
    color: "#E07B4E",
    defaultVisible: true,
    group: "Play call",
    key: "passIncomplete",
    keywords: ["pass incomplete", "incomplete pass", "incompletion"],
    label: "Pass incomplete",
    order: 1,
  },
  {
    color: "#86CF95",
    defaultVisible: true,
    group: "Play call",
    key: "run",
    keywords: ["run", "rush"],
    label: "Run",
    order: 2,
  },
  {
    color: "#E7A0B8",
    defaultVisible: true,
    group: "Play call",
    key: "sack",
    keywords: ["sack"],
    label: "Sack",
    order: 3,
  },
  {
    color: "#4EB5DE",
    defaultVisible: false,
    group: "Play call",
    key: "playAction",
    keywords: ["play action"],
    label: "Play action",
    order: 4,
  },
  {
    color: "#7BCCE0",
    defaultVisible: false,
    group: "Play call",
    key: "bootleg",
    keywords: ["bootleg"],
    label: "Bootleg",
    order: 5,
  },
  {
    color: "#CADF72",
    defaultVisible: false,
    group: "Play call",
    key: "draw",
    keywords: ["draw"],
    label: "Draw",
    order: 6,
  },
  {
    color: "#F5B400",
    defaultVisible: true,
    group: "Special teams",
    key: "kickoff",
    keywords: ["kickoff", "kick off"],
    label: "Kickoff",
    order: 7,
  },
  {
    color: "#F07C4A",
    defaultVisible: true,
    group: "Special teams",
    key: "punt",
    keywords: ["punt"],
    label: "Punt",
    order: 8,
  },
  {
    color: "#F0E24A",
    defaultVisible: true,
    group: "Special teams",
    key: "fieldGoal",
    keywords: ["field goal"],
    label: "Field goal",
    order: 9,
  },
  {
    color: "#F0904A",
    defaultVisible: false,
    group: "Special teams",
    key: "twoPoint",
    keywords: ["two point", "2 point", "2pt", "two point conversion"],
    label: "Two point",
    order: 10,
  },
  {
    color: "#E0C07B",
    defaultVisible: false,
    group: "Special teams",
    key: "onside",
    keywords: ["onside", "onside kick"],
    label: "Onside kick",
    order: 11,
  },
  {
    color: "#05E5AD",
    defaultVisible: true,
    group: "Outcome",
    key: "touchdown",
    keywords: ["touchdown", "td"],
    label: "Touchdown",
    order: 12,
  },
  {
    color: "#DC2626",
    defaultVisible: true,
    group: "Outcome",
    key: "turnover",
    keywords: ["turnover"],
    label: "Turnover",
    order: 13,
  },
  {
    color: "#FD9038",
    defaultVisible: true,
    group: "Outcome",
    key: "explosive",
    keywords: ["explosive", "explosive play"],
    label: "Explosive play",
    order: 14,
  },
  {
    color: "#DE4EA8",
    defaultVisible: true,
    group: "Outcome",
    key: "penalty",
    keywords: ["penalty", "flag"],
    label: "Penalty",
    order: 15,
  },
  {
    color: "#A84EDE",
    defaultVisible: false,
    group: "Outcome",
    key: "bigLoss",
    keywords: ["big loss", "loss", "negative play"],
    label: "Big loss",
    order: 16,
  },
  {
    color: "#DE4E6B",
    defaultVisible: false,
    group: "Outcome",
    key: "redZone",
    keywords: ["red zone", "redzone"],
    label: "Red zone entry",
    order: 17,
  },
  {
    color: "#C4A0F0",
    defaultVisible: true,
    group: "Defense",
    key: "blitz",
    keywords: ["blitz"],
    label: "Blitz",
    order: 18,
  },
  {
    color: "#DE4EB0",
    defaultVisible: true,
    group: "Defense",
    key: "interception",
    keywords: ["interception", "intercepted", "pick"],
    label: "Interception",
    order: 19,
  },
  {
    color: "#9C7BD4",
    defaultVisible: false,
    group: "Defense",
    key: "sackDef",
    keywords: ["sack"],
    label: "Sack (defense)",
    order: 20,
  },
  {
    color: "#DE7BA8",
    defaultVisible: false,
    group: "Defense",
    key: "coverageBreak",
    keywords: ["coverage breakdown", "coverage bust", "blown coverage"],
    label: "Coverage breakdown",
    order: 21,
  },
  {
    color: "#D47B9C",
    defaultVisible: false,
    group: "Defense",
    key: "missedTackle",
    keywords: ["missed tackle"],
    label: "Missed tackle",
    order: 22,
  },
  {
    color: "#4A9EDE",
    defaultVisible: true,
    group: "Down & distance",
    key: "thirdDown",
    keywords: ["3rd", "third down", "down 3"],
    label: "3rd down",
    order: 23,
  },
  {
    color: "#4A9EDE",
    defaultVisible: false,
    group: "Down & distance",
    key: "fourthDown",
    keywords: ["4th", "fourth down", "down 4"],
    label: "4th down",
    order: 24,
  },
  {
    color: "#4ADEC4",
    defaultVisible: false,
    group: "Down & distance",
    key: "goalLine",
    keywords: ["goal line", "goalline"],
    label: "Goal line",
    order: 25,
  },
  {
    color: "#E85A4F",
    defaultVisible: false,
    group: "Down & distance",
    key: "twoMinute",
    keywords: ["2 minute", "two minute"],
    label: "2-minute drill",
    order: 26,
  },
  {
    color: "#F0D74A",
    defaultVisible: false,
    group: "Player notes",
    key: "highlight",
    keywords: ["highlight", "highlight play"],
    label: "Highlight play",
    order: 27,
  },
  {
    color: "#F07A4A",
    defaultVisible: false,
    group: "Player notes",
    key: "coachFlag",
    keywords: ["coach flag"],
    label: "Coach flag",
    order: 28,
  },
  {
    color: "#F05A5A",
    defaultVisible: false,
    group: "Player notes",
    key: "injury",
    keywords: ["injury", "injured"],
    label: "Injury",
    order: 29,
  },
  {
    color: "#A0B0C0",
    defaultVisible: false,
    group: "Player notes",
    key: "substitution",
    keywords: ["substitution", "sub"],
    label: "Substitution",
    order: 30,
  },
];

const TAG_TYPE_CATALOG_BY_SPORT: Partial<Record<SportTableKind, TimelineTagTypeDefinition[]>> = {
  "american-football": FOOTBALL_TAG_TYPE_DEFINITIONS,
};

const hasTimelineValue = (value: string | null | undefined) =>
  !EMPTY_TIMELINE_VALUES.has(
    String(value ?? "")
      .trim()
      .toLowerCase()
  );

const normalizeTagTypeText = (value: string | null | undefined) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[_-]+/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getComparableTimelineTagText = (row: SgTagRow) =>
  normalizeTagTypeText(
    [
      row.action,
      row.result,
      row.primaryDetail,
      row.secondaryDetail,
      row.team,
      row.groupValue,
      ...Object.entries(row.context).flatMap(([key, value]) => [key, value]),
    ].join(" ")
  );

const matchesPhrase = (text: string, phrase: string) => {
  const normalizedPhrase = normalizeTagTypeText(phrase);
  if (!normalizedPhrase) return false;

  return new RegExp(`(?:^|\\s)${normalizedPhrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:\\s|$)`).test(text);
};

const getTimelineTagTypeCatalog = (sport: SportTableKind) => TAG_TYPE_CATALOG_BY_SPORT[sport] ?? [];

export const hashString = (value: string) => {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
};

const formatTagTypeLabelPart = (value: string) =>
  value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

const getUniqueObservedTagTypeParts = (values: readonly string[]) => {
  const seen = new Set<string>();
  const parts: string[] = [];

  values.forEach((value) => {
    const normalizedValue = normalizeTagTypeText(value);
    if (!normalizedValue || seen.has(normalizedValue) || !hasTimelineValue(normalizedValue)) return;

    seen.add(normalizedValue);
    parts.push(normalizedValue);
  });

  return parts;
};

const getObservedTimelineTagTypeParts = (row: SgTagRow) => {
  const actionParts = getUniqueObservedTagTypeParts([row.action, row.result]);
  if (actionParts.length > 0) return actionParts;

  const detailParts = getUniqueObservedTagTypeParts([row.primaryDetail, row.secondaryDetail]);
  if (detailParts.length > 0) return detailParts;

  return getUniqueObservedTagTypeParts([row.groupValue, row.team]);
};

export const getObservedTimelineTagTypeKey = (row: SgTagRow) => {
  const key = getObservedTimelineTagTypeParts(row).join("|");
  return key ? `observed:${key}` : `observed:${row.id}`;
};

const getObservedTimelineTagTypeLabel = (row: SgTagRow) => {
  const label = getObservedTimelineTagTypeParts(row).map(formatTagTypeLabelPart).join(" - ");
  return label || "Tag";
};

const getCatalogRowTagTypeKeys = (row: SgTagRow, sport: SportTableKind) => {
  const text = getComparableTimelineTagText(row);

  return getTimelineTagTypeCatalog(sport)
    .filter((definition) => definition.keywords.some((keyword) => matchesPhrase(text, keyword)))
    .map((definition) => definition.key);
};

export const getTimelineRowTagTypeKeys = (row: SgTagRow, sport: SportTableKind) => {
  const catalogKeys = getCatalogRowTagTypeKeys(row, sport);
  return catalogKeys.length > 0 ? catalogKeys : [getObservedTimelineTagTypeKey(row)];
};

export const getTimelinePrimaryTagTypeKey = (
  row: SgTagRow,
  sport: SportTableKind,
  visibleTagTypeKeys?: ReadonlySet<string>
) => {
  const keys = getTimelineRowTagTypeKeys(row, sport);
  return keys.find((key) => visibleTagTypeKeys?.has(key) ?? true) ?? keys[0] ?? getObservedTimelineTagTypeKey(row);
};

export const buildTimelineTagTypeOptions = (
  rows: SgTagRow[],
  sport: SportTableKind,
  { getObservedGroup }: BuildTimelineTagTypeOptionsArgs = {}
) => {
  const catalog = getTimelineTagTypeCatalog(sport);
  const catalogKeySet = new Set(catalog.map((definition) => definition.key));
  const catalogMatchCounts = new Map<string, number>();
  const observedOptionsByKey = new Map<string, TimelineTagTypeOption>();

  rows.forEach((row) => {
    const rowKeys = getTimelineRowTagTypeKeys(row, sport);
    rowKeys.forEach((key) => {
      if (catalogKeySet.has(key)) {
        catalogMatchCounts.set(key, (catalogMatchCounts.get(key) ?? 0) + 1);
      }
    });

    if (rowKeys.some((key) => catalogKeySet.has(key))) return;

    const key = getObservedTimelineTagTypeKey(row);
    const currentOption = observedOptionsByKey.get(key);
    if (currentOption) {
      observedOptionsByKey.set(key, { ...currentOption, matchCount: currentOption.matchCount + 1 });
      return;
    }

    const observedGroup = catalog.length === 0 && getObservedGroup ? getObservedGroup(row) : null;
    observedOptionsByKey.set(key, {
      color: MARKER_COLORS[hashString(key) % MARKER_COLORS.length],
      defaultVisible: true,
      group: observedGroup?.group ?? OBSERVED_TAG_GROUP,
      key,
      label: getObservedTimelineTagTypeLabel(row),
      matchCount: 1,
      order: observedGroup?.order ?? OBSERVED_TAG_ORDER,
      source: "observed",
    });
  });

  return [
    ...catalog.map<TimelineTagTypeOption>((definition) => ({
      color: definition.color,
      defaultVisible: definition.defaultVisible,
      group: definition.group,
      key: definition.key,
      label: definition.label,
      matchCount: catalogMatchCounts.get(definition.key) ?? 0,
      order: definition.order,
      source: "catalog",
    })),
    ...observedOptionsByKey.values(),
  ].sort((left, right) => left.order - right.order || left.label.localeCompare(right.label));
};
