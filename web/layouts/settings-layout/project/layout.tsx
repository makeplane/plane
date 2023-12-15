import { FC, ReactNode } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// hooks
import { useUser } from "hooks/store";
// components
import { ProjectSettingsSidebar } from "./sidebar";
import { NotAuthorizedView } from "components/auth-screens";
// ui
import { Button, LayersIcon } from "@plane/ui";
// constants
import { EUserProjectRoles } from "constants/project";

export interface IProjectSettingLayout {
  children: ReactNode;
}

export const ProjectSettingLayout: FC<IProjectSettingLayout> = observer((props) => {
  const { children } = props;
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // store hooks
  const {
    membership: { currentProjectRole },
  } = useUser();

  const restrictViewSettings = currentProjectRole && currentProjectRole <= EUserProjectRoles.VIEWER;

  return restrictViewSettings ? (
    <NotAuthorizedView
      type="project"
      actionButton={
        <Button
          variant="primary"
          size="md"
          prependIcon={<LayersIcon />}
          onClick={() => router.push(`/${workspaceSlug}/projects/${projectId}/issues`)}
        >
          Go to issues
        </Button>
      }
    />
  ) : (
    <div className="flex h-full w-full gap-2 overflow-x-hidden overflow-y-scroll">
      <div className="w-80 flex-shrink-0 overflow-y-hidden pt-8">
        <ProjectSettingsSidebar />
      </div>
      {children}
    </div>
  );
});
