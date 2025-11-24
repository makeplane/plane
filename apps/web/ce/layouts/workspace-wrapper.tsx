import type { FC } from "react";
import { observer } from "mobx-react";
// layouts
import { WorkspaceAuthWrapper as CoreWorkspaceAuthWrapper } from "@/layouts/auth-layout/workspace-wrapper";

export type IWorkspaceAuthWrapper = {
  children: React.ReactNode;
};

export const WorkspaceAuthWrapper = observer(function WorkspaceAuthWrapper(props: IWorkspaceAuthWrapper) {
  // props
  const { children } = props;

  return <CoreWorkspaceAuthWrapper>{children}</CoreWorkspaceAuthWrapper>;
});
