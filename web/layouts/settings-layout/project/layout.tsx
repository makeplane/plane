import { FC, ReactNode } from "react";
// components
import { ProjectSettingsSidebar } from "./sidebar";
import { useMobxStore } from "lib/mobx/store-provider";
import { EUserWorkspaceRoles } from "constants/workspace";
import { NotAuthorizedView } from "components/auth-screens";
import { observer } from "mobx-react-lite";

export interface IProjectSettingLayout {
  children: ReactNode;
}

export const ProjectSettingLayout: FC<IProjectSettingLayout> = observer((props) => {
  const { children } = props;

  const {
    user: { currentProjectRole },
  } = useMobxStore();

  const restrictViewSettings = currentProjectRole && currentProjectRole <= EUserWorkspaceRoles.VIEWER;

  return restrictViewSettings ? (
    <NotAuthorizedView type="project" />
  ) : (
    <div className="flex gap-2 h-full w-full overflow-x-hidden overflow-y-scroll">
      <div className="w-80 pt-8 overflow-y-hidden flex-shrink-0">
        <ProjectSettingsSidebar />
      </div>
      {children}
    </div>
  );
});
