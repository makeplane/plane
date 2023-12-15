import { FC } from "react";
import { useRouter } from "next/router";

// ui
import { Breadcrumbs } from "@plane/ui";
// helper
import { renderEmoji } from "helpers/emoji.helper";
// hooks
import { useMobxStore } from "lib/mobx/store-provider";
import { observer } from "mobx-react-lite";
// constants
import { EUserWorkspaceRoles } from "constants/workspace";

export interface IProjectSettingHeader {
  title: string;
}

export const ProjectSettingHeader: FC<IProjectSettingHeader> = observer((props) => {
  const { title } = props;
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // store
  const {
    project: projectStore,
    user: { currentProjectRole },
  } = useMobxStore();
  const { currentProjectDetails } = projectStore;

  if (currentProjectRole && currentProjectRole <= EUserWorkspaceRoles.VIEWER) return null;

  return (
    <div className="relative z-10 flex h-[3.75rem] w-full flex-shrink-0 flex-row items-center justify-between gap-x-2 gap-y-4 border-b border-custom-border-200 bg-custom-sidebar-background-100 p-4">
      <div className="flex w-full flex-grow items-center gap-2 overflow-ellipsis whitespace-nowrap">
        <div>
          <Breadcrumbs>
            <Breadcrumbs.BreadcrumbItem
              type="text"
              label={currentProjectDetails?.name ?? "Project"}
              icon={
                currentProjectDetails?.emoji ? (
                  renderEmoji(currentProjectDetails.emoji)
                ) : currentProjectDetails?.icon_prop ? (
                  renderEmoji(currentProjectDetails.icon_prop)
                ) : (
                  <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded bg-gray-700 uppercase text-white">
                    {currentProjectDetails?.name.charAt(0)}
                  </span>
                )
              }
              link={`/${workspaceSlug}/projects/${currentProjectDetails?.id}/issues`}
            />
            <Breadcrumbs.BreadcrumbItem type="text" label={title} />
          </Breadcrumbs>
        </div>
      </div>
    </div>
  );
});
