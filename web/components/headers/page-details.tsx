import { FC } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { FileText, Plus } from "lucide-react";
// services
import { PageService } from "services/page.service";

// constants
import { PAGE_DETAILS } from "constants/fetch-keys";

// hooks
import { useMobxStore } from "lib/mobx/store-provider";
// ui
import { Breadcrumbs, Button } from "@plane/ui";
// helper
import { renderEmoji } from "helpers/emoji.helper";

import useSWR from "swr";

export interface IPagesHeaderProps {
  showButton?: boolean;
}
const pageService = new PageService();

export const PageDetailsHeader: FC<IPagesHeaderProps> = observer((props) => {
  const { showButton = false } = props;

  const router = useRouter();
  const { workspaceSlug, pageId } = router.query;

  const { project: projectStore, commandPalette: commandPaletteStore } = useMobxStore();
  const { currentProjectDetails } = projectStore;

  const { data: pageDetails } = useSWR(
    workspaceSlug && currentProjectDetails?.id && pageId ? PAGE_DETAILS(pageId as string) : null,
    workspaceSlug && currentProjectDetails?.id
      ? () => pageService.getPageDetails(workspaceSlug as string, currentProjectDetails.id, pageId as string)
      : null
  );

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
              link={`/${workspaceSlug}/projects/${currentProjectDetails?.id}/pages`}
            />
            <Breadcrumbs.BreadcrumbItem
              type="text"
              icon={<FileText className="h-4 w-4 text-custom-text-300" />}
              label={pageDetails?.name ?? "Page"}
            />
          </Breadcrumbs>
        </div>
      </div>
      {showButton && (
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            prependIcon={<Plus />}
            size="sm"
            onClick={() => commandPaletteStore.toggleCreatePageModal(true)}
          >
            Create Page
          </Button>
        </div>
      )}
    </div>
  );
});
