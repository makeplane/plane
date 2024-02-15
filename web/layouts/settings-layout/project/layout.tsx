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
import { EUserProjectRoles, PROJECT_SETTINGS_LINKS } from "constants/project";
import { cn } from "helpers/common.helper";

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
    <div>
      <div className="sticky flex md:hidden overflow-x-scroll z-10 bg-custom-background-100 border-b border-custom-border-200 top-0">
        {PROJECT_SETTINGS_LINKS.map(link => <div onClick={() => router.push(`/${workspaceSlug}/projects/${projectId}${link.href}`)} className={cn("px-4", link.highlight(router.asPath, `/${workspaceSlug}/projects/${projectId}`) ? "border-b border-custom-primary-100" : "")}><div className="py-1 text-sm text-custom-text-300">{link.label}</div></div>)}
      </div>
      <div className="inset-y-0 z-20 flex flex-grow-0 h-full w-full gap-2 overflow-x-hidden overflow-y-scroll">
        <div className="w-80 flex-shrink-0 overflow-y-hidden pt-8 sm:hidden hidden md:block lg:block">
          <ProjectSettingsSidebar />
        </div>
        <div className="w-full pl-10 sm:pl-10 md:pl-0 lg:pl-0">
          {children}
        </div>
      </div>
    </div>
  );
});
