import { createContext, useContext } from "react";
import { useParams } from "next/navigation";
import { EIssuesStoreType } from "@/constants/issue";
import { useIssues } from "./store";

export const IssuesStoreContext = createContext<EIssuesStoreType | undefined>(undefined);

export const useIssueStoreType = () => {
  const storeType = useContext(IssuesStoreContext);

  const { globalViewId, viewId, projectId, cycleId, moduleId, userId } = useParams();

  if (storeType) return storeType;

  if (globalViewId) return EIssuesStoreType.GLOBAL;

  if (userId) return EIssuesStoreType.PROFILE;

  if (viewId) return EIssuesStoreType.PROJECT_VIEW;

  if (cycleId) return EIssuesStoreType.CYCLE;

  if (moduleId) return EIssuesStoreType.MODULE;

  if (projectId) return EIssuesStoreType.PROJECT;

  return EIssuesStoreType.PROJECT;
};

export const useIssuesStore = () => {
  const storeType = useContext(IssuesStoreContext);

  return useIssues(storeType);
};
