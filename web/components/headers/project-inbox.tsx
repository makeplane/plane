import { FC, useState } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { Plus } from "lucide-react";
// hooks
import { useProject } from "hooks/store";
// ui
import { Breadcrumbs, Button, LayersIcon } from "@plane/ui";
// components
import { CreateInboxIssueModal } from "components/inbox";
import { SidebarHamburgerToggle } from "components/core/sidebar/sidebar-menu-hamburger-toggle";
import { BreadcrumbLink } from "components/common";
// helper
import { renderEmoji } from "helpers/emoji.helper";

export const ProjectInboxHeader: FC = observer(() => {
  // states
  const [createIssueModal, setCreateIssueModal] = useState(false);
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // store hooks
  const { currentProjectDetails } = useProject();

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
                  href={`/${workspaceSlug}/projects`}
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
              link={
                <BreadcrumbLink label="Inbox Issues" icon={<LayersIcon className="h-4 w-4 text-custom-text-300" />} />
              }
            />
          </Breadcrumbs>
        </div>
      </div>

      {currentProjectDetails?.inbox_view && (
        <div className="flex items-center gap-2">
          <CreateInboxIssueModal isOpen={createIssueModal} onClose={() => setCreateIssueModal(false)} />
          <Button variant="primary" prependIcon={<Plus />} size="sm" onClick={() => setCreateIssueModal(true)}>
            Add Issue
          </Button>
        </div>
      )}
    </div>
  );
});
