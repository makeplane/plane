import type { SgTagRow } from "./types";

type TimelineCategoryDefinition = {
  id: string;
  keywords: string[];
};

const EMPTY_TIMELINE_VALUES = new Set(["", "--", "\u2014", "n/a", "na", "none", "null", "undefined"]);

const hasTimelineValue = (value: string | null | undefined) =>
  !EMPTY_TIMELINE_VALUES.has(
    String(value ?? "")
      .trim()
      .toLowerCase()
  );

export const getTimelineJerseyNumberKeys = (value: string) => {
  const normalizedValue = value.trim().replace(/^#/, "").replace(/\s+/g, "");
  const numberMatch = normalizedValue.match(/^\d+$/)
    ? normalizedValue
    : (value.match(/#\s*([A-Za-z0-9-]+)/)?.[1] ?? value.match(/\b(\d{1,3})\b/)?.[1] ?? "");

  if (!numberMatch) return [];

  const normalizedNumber = numberMatch.replace(/^#/, "").replace(/\s+/g, "");
  const withoutLeadingZeros = normalizedNumber.replace(/^0+(?=\d)/, "");

  return Array.from(new Set([withoutLeadingZeros.toLowerCase(), normalizedNumber.toLowerCase()].filter(Boolean)));
};

export const getTimelinePlayerLaneKey = (player: string) => getTimelineJerseyNumberKeys(player)[0] ?? player.trim();

export const buildTimelinePlayerLaneId = (player: string) => `player-${player}`;

const getComparableTimelineText = (
  row: Pick<SgTagRow, "action" | "context" | "groupValue" | "primaryDetail" | "result" | "secondaryDetail" | "team">
) =>
  [
    row.action,
    row.result,
    row.primaryDetail,
    row.secondaryDetail,
    row.team,
    row.groupValue,
    ...Object.values(row.context),
  ]
    .join(" ")
    .toLowerCase()
    .replace(/[_-]+/g, " ");

export const getTimelineCategoryLaneId = (
  row: Pick<SgTagRow, "action" | "context" | "groupValue" | "primaryDetail" | "result" | "secondaryDetail" | "team">,
  categoryLanes: TimelineCategoryDefinition[]
) => {
  const text = getComparableTimelineText(row);
  const matchedLane = categoryLanes.find((lane) => lane.keywords.some((keyword) => text.includes(keyword)));

  return matchedLane?.id ?? categoryLanes[0]?.id ?? "actions";
};

export const getTimelineRowLaneIds = (
  row: Pick<
    SgTagRow,
    "action" | "context" | "groupValue" | "player" | "primaryDetail" | "result" | "secondaryDetail" | "team"
  >,
  categoryLanes: TimelineCategoryDefinition[]
) => {
  const categoryLaneId = getTimelineCategoryLaneId(row, categoryLanes);
  const player = row.player.trim();
  if (!hasTimelineValue(player)) return [categoryLaneId];

  return [categoryLaneId, buildTimelinePlayerLaneId(getTimelinePlayerLaneKey(player))];
};
