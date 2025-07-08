import { createContext, useContext } from "react";
import { useParams } from "next/navigation";
import { EIssuesStoreType } from "@plane/types";
import { useIssues } from "./store";

export const IssuesStoreContext = createContext<EIssuesStoreType | undefined>(undefined);

export const useIssueStoreType = () => {
  const storeType = useContext(IssuesStoreContext);
  const { globalViewId, viewId, projectId, cycleId, moduleId, userId, epicId, teamspaceId } = useParams();

  // If store type exists in context, use that store type
  if (storeType) return storeType;

  // else check the router params to determine the issue store
  if (globalViewId) return EIssuesStoreType.GLOBAL;

  if (userId) return EIssuesStoreType.PROFILE;

  if (viewId) return EIssuesStoreType.PROJECT_VIEW;

  if (cycleId) return EIssuesStoreType.CYCLE;

  if (moduleId) return EIssuesStoreType.MODULE;

  if (epicId) return EIssuesStoreType.EPIC;

  if (projectId) return EIssuesStoreType.PROJECT;

  if (teamspaceId) return EIssuesStoreType.TEAM;

  if (teamspaceId && viewId) return EIssuesStoreType.TEAM_VIEW;

  return EIssuesStoreType.PROJECT;
};

export const useIssuesStore = () => {
  const storeType = useIssueStoreType();

  return useIssues(storeType);
};
