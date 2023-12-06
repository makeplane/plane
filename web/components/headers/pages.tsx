import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { FileText, Plus } from "lucide-react";
// hooks
import { useMobxStore } from "lib/mobx/store-provider";
// ui
import { Breadcrumbs, Button } from "@plane/ui";
// helper
import { renderEmoji } from "helpers/emoji.helper";
// constants
import { EUserWorkspaceRoles } from "constants/workspace";

export const PagesHeader = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // mobx store
  const {
    user: { currentProjectRole },
    project: { currentProjectDetails },
    commandPalette: { toggleCreatePageModal },
  } = useMobxStore();

  const canUserCreatePage =
    currentProjectRole && [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER].includes(currentProjectRole);

  return (
    <div className="relative flex w-full flex-shrink-0 flex-row z-10 h-[3.75rem] items-center justify-between gap-x-2 gap-y-4 border-b border-custom-border-200 bg-custom-sidebar-background-100 p-4">
      <div className="flex items-center gap-2 flex-grow w-full whitespace-nowrap overflow-ellipsis">
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
            <Breadcrumbs.BreadcrumbItem
              type="text"
              icon={<FileText className="h-4 w-4 text-custom-text-300" />}
              label="Pages"
            />
          </Breadcrumbs>
        </div>
      </div>
      {canUserCreatePage && (
        <div className="flex items-center gap-2">
          <Button variant="primary" prependIcon={<Plus />} size="sm" onClick={() => toggleCreatePageModal(true)}>
            Create Page
          </Button>
        </div>
      )}
    </div>
  );
});
