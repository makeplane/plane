import { FC } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { Plus } from "lucide-react";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// ui
import { Breadcrumbs, Button, ContrastIcon } from "@plane/ui";
// helpers
import { renderEmoji } from "helpers/emoji.helper";
import { EUserWorkspaceRoles } from "constants/workspace";

export const CyclesHeader: FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // store
  const {
    project: projectStore,
    user: { currentProjectRole },
    commandPalette: commandPaletteStore,
    trackEvent: { setTrackElement },
  } = useMobxStore();
  const { currentProjectDetails } = projectStore;

  const canUserCreateCycle =
    currentProjectRole && [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER].includes(currentProjectRole);

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
                  <span className="flex h-4 w-4 items-center justify-center rounded bg-gray-700 uppercase text-white">
                    {currentProjectDetails?.name.charAt(0)}
                  </span>
                )
              }
              link={`/${workspaceSlug}/projects/${currentProjectDetails?.id}/issues`}
            />
            <Breadcrumbs.BreadcrumbItem
              type="text"
              icon={<ContrastIcon className="h-4 w-4 text-custom-text-300" />}
              label="Cycles"
            />
          </Breadcrumbs>
        </div>
      </div>
      {canUserCreateCycle && (
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            prependIcon={<Plus />}
            onClick={() => {
              setTrackElement("CYCLES_PAGE_HEADER");
              commandPaletteStore.toggleCreateCycleModal(true);
            }}
          >
            Add Cycle
          </Button>
        </div>
      )}
    </div>
  );
});
