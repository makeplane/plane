// plane imports
import { ETeamspaceEntityScope } from "@plane/constants";
import { TTeamspaceActivityKeys, TTeamspaceActivityVerbs, TTeamspaceActivityFields } from "@plane/types";

// Get the label for the entity scope
export const getTeamspaceEntityScopeLabel = (entity: ETeamspaceEntityScope) => {
  switch (entity) {
    case ETeamspaceEntityScope.TEAM:
      return "Team";
    case ETeamspaceEntityScope.PROJECT:
      return "Project";
    default:
      return "Unknown";
  }
};

// Get the key for the issue property type based on the property type and relation type
export const getTeamspaceActivityKey = (
  activityField: TTeamspaceActivityFields | undefined,
  activityVerb: TTeamspaceActivityVerbs
) => `${activityField ? `${activityField}_` : ""}${activityVerb}` as TTeamspaceActivityKeys;
