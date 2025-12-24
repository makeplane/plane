import type { EIssueLayoutTypes, IProjectView } from "@plane/types";
import type { TWorkspaceLayoutProps } from "@/components/views/helper";

export type TLayoutSelectionProps = {
  onChange: (layout: EIssueLayoutTypes) => void;
  selectedLayout: EIssueLayoutTypes;
  workspaceSlug: string;
};

export function GlobalViewLayoutSelection(props: TLayoutSelectionProps) {
  return <></>;
}

export function WorkspaceAdditionalLayouts(props: TWorkspaceLayoutProps) {
  return <></>;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function AdditionalHeaderItems(view: IProjectView) {
  return <></>;
}
