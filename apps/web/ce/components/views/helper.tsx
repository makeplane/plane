import { EIssueLayoutTypes } from "@plane/types";
import { TWorkspaceLayoutProps } from "@/components/views/helper";

export type TLayoutSelectionProps = {
  onChange: (layout: EIssueLayoutTypes) => void;
  selectedLayout: EIssueLayoutTypes;
  workspaceSlug: string;
};

export const GlobalViewLayoutSelection = (props: TLayoutSelectionProps) => <></>;

export const WorkspaceAdditionalLayouts = (props: TWorkspaceLayoutProps) => <></>;
