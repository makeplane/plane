// plane imports
import { ETeamEntityScope } from "@plane/constants";
import { TTeamActivityKeys, TTeamActivityVerbs, TTeamActivityFields } from "@plane/types";

// Get the label for the entity scope
export const getTeamEntityScopeLabel = (entity: ETeamEntityScope) => {
  switch (entity) {
    case ETeamEntityScope.TEAM:
      return "Team";
    case ETeamEntityScope.PROJECT:
      return "Project";
    default:
      return "Unknown";
  }
};

// Get the key for the issue property type based on the property type and relation type
export const getTeamActivityKey = (activityField: TTeamActivityFields | undefined, activityVerb: TTeamActivityVerbs) =>
  `${activityField ? `${activityField}_` : ""}${activityVerb}` as TTeamActivityKeys;
