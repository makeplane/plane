// types
import type { IIssueDisplayProperties } from "@plane/types";
// lib
import { store } from "@/lib/store-context";

export const shouldRenderColumn = (key: keyof IIssueDisplayProperties): boolean => {
  const isEstimateEnabled: boolean = store.projectRoot.project.currentProjectDetails?.estimate !== null;
  switch (key) {
    case "estimate":
      return isEstimateEnabled;
    default:
      return true;
  }
};
