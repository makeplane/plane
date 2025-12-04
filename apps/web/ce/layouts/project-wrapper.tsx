import { observer } from "mobx-react";
// layouts
import { ProjectAuthWrapper as CoreProjectAuthWrapper } from "@/layouts/auth-layout/project-wrapper";

export type IProjectAuthWrapper = {
  workspaceSlug: string;
  projectId: string;
  children: React.ReactNode;
};

export const ProjectAuthWrapper = observer(function ProjectAuthWrapper(props: IProjectAuthWrapper) {
  // props
  const { workspaceSlug, projectId, children } = props;

  return (
    <CoreProjectAuthWrapper workspaceSlug={workspaceSlug} projectId={projectId}>
      {children}
    </CoreProjectAuthWrapper>
  );
});
