import { FC, ReactNode } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import Link from "next/link";
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
        //TODO: Create a new component called Button Link to handle such scenarios
        <Link href={`/${workspaceSlug}/projects/${projectId}/issues`}>
          <Button variant="primary" size="md" prependIcon={<LayersIcon />}>
            Go to issues
          </Button>
        </Link>
      }
    />
  ) : (
    <div className="inset-y-0 z-20 flex flex-grow-0 h-full w-full gap-2 overflow-x-hidden overflow-y-scroll">
      <div className="w-80 flex-shrink-0 overflow-y-hidden pt-8 sm:hidden hidden md:block lg:block">
        <ProjectSettingsSidebar />
      </div>
      <div className="w-full pl-10 sm:pl-10 md:pl-0 lg:pl-0">
        {children}
      </div>
    </div>
  );
});
