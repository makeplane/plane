// hooks
import { useProject, useProjectState, useMember } from "hooks/store";
// types
import { TViewFilters } from "@plane/types";

type TFilterPropertyItemByFilterKeyAndId = {
  key: keyof TViewFilters;
  id: string;
  icon: string;
  title: string;
};

export const filterPropertyItemByFilterKeyAndId = (
  key: keyof TViewFilters,
  id: string
): TFilterPropertyItemByFilterKeyAndId | undefined => {
  if (!key || id) return undefined;

  switch (key) {
    case "project":
      return undefined; // store
    case "module":
      return undefined; // store
    case "cycle":
      return undefined; // store
    case "priority":
      return undefined; // constant
    case "state":
      return undefined; // store
    case "state_group":
      return undefined; // constant
    case "assignees":
      return undefined; // store -> workspace and project level
    case "mentions":
      return undefined; // store -> workspace and project level
    case "subscriber":
      return undefined; // store -> workspace and project level
    case "created_by":
      return undefined; // store -> workspace and project level
    case "labels":
      return undefined; // store -> workspace and project level
    case "start_date":
      return undefined; // constants
    case "target_date":
      return undefined; // constants
    default:
      return undefined;
  }
};
