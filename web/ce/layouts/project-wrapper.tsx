import { FC } from "react";
import { observer } from "mobx-react";
// layouts
import { ProjectAuthWrapper as CoreProjectAuthWrapper } from "@/layouts/auth-layout";
// plane-web imports hooks
import { useProjectResources } from "@/plane-web/hooks/use-project-resources";

export type IProjectAuthWrapper = {
  workspaceSlug: string;
  projectId: string;
  children: React.ReactNode;
};

export const ProjectAuthWrapper: FC<IProjectAuthWrapper> = observer((props) => {
  // props
  const { workspaceSlug, projectId, children } = props;

  useProjectResources(workspaceSlug?.toString(), projectId?.toString());

  return (
    <CoreProjectAuthWrapper workspaceSlug={workspaceSlug} projectId={projectId}>
      {children}
    </CoreProjectAuthWrapper>
  );
});
