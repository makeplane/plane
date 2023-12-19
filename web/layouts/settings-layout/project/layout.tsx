import { FC, ReactNode } from "react";
import { useRouter } from "next/router";
// components
import { ProjectSettingsSidebar } from "./sidebar";
import { useMobxStore } from "lib/mobx/store-provider";
import { EUserWorkspaceRoles } from "constants/workspace";
import { NotAuthorizedView } from "components/auth-screens";
import { observer } from "mobx-react-lite";
import { Button, LayersIcon } from "@plane/ui";

export interface IProjectSettingLayout {
  children: ReactNode;
}

export const ProjectSettingLayout: FC<IProjectSettingLayout> = observer((props) => {
  const { children } = props;

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const {
    user: { currentProjectRole },
  } = useMobxStore();

  const restrictViewSettings = currentProjectRole && currentProjectRole <= EUserWorkspaceRoles.VIEWER;

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
