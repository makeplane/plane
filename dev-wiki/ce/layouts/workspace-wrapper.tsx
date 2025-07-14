import { FC } from "react";
import { observer } from "mobx-react";
// layouts
import { WorkspaceAuthWrapper as CoreWorkspaceAuthWrapper } from "@/layouts/auth-layout";

export type IWorkspaceAuthWrapper = {
  children: React.ReactNode;
};

export const WorkspaceAuthWrapper: FC<IWorkspaceAuthWrapper> = observer((props) => {
  // props
  const { children } = props;

  return <CoreWorkspaceAuthWrapper>{children}</CoreWorkspaceAuthWrapper>;
});
