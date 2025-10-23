// types
import type { IIssueDisplayProperties } from "@plane/types";
// lib
import { store } from "@/lib/store-context";

export type TShouldRenderDisplayProperty = {
  workspaceSlug: string;
  projectId: string | undefined;
  key: keyof IIssueDisplayProperties;
};

export const shouldRenderDisplayProperty = (props: TShouldRenderDisplayProperty) => {
  const { key } = props;
  switch (key) {
    case "issue_type":
      return false;
    default:
      return true;
  }
};

export const shouldRenderColumn = (key: keyof IIssueDisplayProperties): boolean => {
  const isEstimateEnabled: boolean = store.projectRoot.project.currentProjectDetails?.estimate !== null;
  switch (key) {
    case "estimate":
      return isEstimateEnabled;
    default:
      return true;
  }
};
