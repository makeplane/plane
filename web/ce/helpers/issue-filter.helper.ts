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
