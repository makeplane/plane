import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { Plus } from "lucide-react";
// hooks
import { useApplication, useProject, useUser } from "hooks/store";
import useLocalStorage from "hooks/use-local-storage";
// ui
import { Breadcrumbs, Button, Tooltip, DiceIcon } from "@plane/ui";
// helper
import { renderEmoji } from "helpers/emoji.helper";
// constants
import { MODULE_VIEW_LAYOUTS } from "constants/module";
import { EUserProjectRoles } from "constants/project";
// components
import { SidebarHamburgerToggle } from "components/core/sidebar/sidebar-menu-hamburger-toggle";
import { BreadcrumbLink } from "components/common";

export const ModulesListHeader: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // store hooks
  const { commandPalette: commandPaletteStore } = useApplication();
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { currentProjectDetails } = useProject();

  const { storedValue: modulesView, setValue: setModulesView } = useLocalStorage("modules_view", "grid");

  const canUserCreateModule =
    currentProjectRole && [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER].includes(currentProjectRole);

  return (
    <div className="relative z-10 flex h-[3.75rem] w-full flex-shrink-0 flex-row items-center justify-between gap-x-2 gap-y-4 border-b border-custom-border-200 bg-custom-sidebar-background-100 p-4">
      <div className="flex w-full flex-grow items-center gap-2 overflow-ellipsis whitespace-nowrap">
        <SidebarHamburgerToggle />
        <div>
          <Breadcrumbs>
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <BreadcrumbLink
                  href={`/${workspaceSlug}/projects/${currentProjectDetails?.id}/issues`}
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
                />
              }
            />
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={<BreadcrumbLink label="Modules" icon={<DiceIcon className="h-4 w-4 text-custom-text-300" />} />}
            />
          </Breadcrumbs>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 rounded bg-custom-background-80 p-1">
          {MODULE_VIEW_LAYOUTS.map((layout) => (
            <Tooltip key={layout.key} tooltipContent={layout.title}>
              <button
                type="button"
                className={`group grid h-[22px] w-7 place-items-center overflow-hidden rounded transition-all hover:bg-custom-background-100 ${
                  modulesView == layout.key ? "bg-custom-background-100 shadow-custom-shadow-2xs" : ""
                }`}
                onClick={() => setModulesView(layout.key)}
              >
                <layout.icon
                  strokeWidth={2}
                  className={`h-3.5 w-3.5 ${
                    modulesView == layout.key ? "text-custom-text-100" : "text-custom-text-200"
                  }`}
                />
              </button>
            </Tooltip>
          ))}
        </div>
        {canUserCreateModule && (
          <Button
            variant="primary"
            size="sm"
            prependIcon={<Plus />}
            onClick={() => commandPaletteStore.toggleCreateModuleModal(true)}
          >
            Add Module
          </Button>
        )}
      </div>
    </div>
  );
});
