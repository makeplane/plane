// types
import { IIssueDisplayProperties } from "@plane/types";

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

export type TShouldRenderColumn = {
  key: keyof IIssueDisplayProperties;
  isEstimateEnabled: boolean;
};

export const shouldRenderColumn = (props: TShouldRenderColumn): boolean => {
  const { key, isEstimateEnabled } = props;
  switch (key) {
    case "estimate":
      return isEstimateEnabled;
    default:
      return true;
  }
};
