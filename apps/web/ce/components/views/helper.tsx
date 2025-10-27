import type { EIssueLayoutTypes, IProjectView } from "@plane/types";
import type { TWorkspaceLayoutProps } from "@/components/views/helper";

export type TLayoutSelectionProps = {
  onChange: (layout: EIssueLayoutTypes) => void;
  selectedLayout: EIssueLayoutTypes;
  workspaceSlug: string;
};

export const GlobalViewLayoutSelection = (props: TLayoutSelectionProps) => <></>;

export const WorkspaceAdditionalLayouts = (props: TWorkspaceLayoutProps) => <></>;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const AdditionalHeaderItems = (view: IProjectView) => <></>;
