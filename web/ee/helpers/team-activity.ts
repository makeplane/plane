import { TTeamActivityFields, TTeamActivityKeys, TTeamActivityVerbs } from "@/plane-web/types";

// Get the key for the issue property type based on the property type and relation type
export const getTeamActivityKey = (activityField: TTeamActivityFields | undefined, activityVerb: TTeamActivityVerbs) =>
  `${activityField ? `${activityField}_` : ""}${activityVerb}` as TTeamActivityKeys;
