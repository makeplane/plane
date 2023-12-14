import { FC } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
import { FileText, Plus } from "lucide-react";
// hooks
import { useApplication, useProject } from "hooks/store";
// services
import { PageService } from "services/page.service";
// ui
import { Breadcrumbs, Button } from "@plane/ui";
// helpers
import { renderEmoji } from "helpers/emoji.helper";
// fetch-keys
import { PAGE_DETAILS } from "constants/fetch-keys";

export interface IPagesHeaderProps {
  showButton?: boolean;
}
const pageService = new PageService();

export const PageDetailsHeader: FC<IPagesHeaderProps> = observer((props) => {
  const { showButton = false } = props;

  const router = useRouter();
  const { workspaceSlug, pageId } = router.query;

  const { commandPalette: commandPaletteStore } = useApplication();
  const { currentProjectDetails } = useProject();

  const { data: pageDetails } = useSWR(
    workspaceSlug && currentProjectDetails?.id && pageId ? PAGE_DETAILS(pageId as string) : null,
    workspaceSlug && currentProjectDetails?.id
      ? () => pageService.getPageDetails(workspaceSlug as string, currentProjectDetails.id, pageId as string)
      : null
  );

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
