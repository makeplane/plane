import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { Plus } from "lucide-react";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { CreateUpdateProjectViewModal } from "components/views";
// components
import { Breadcrumbs, PhotoFilterIcon, Button } from "@plane/ui";
// helpers
import { renderEmoji } from "helpers/emoji.helper";

export const ProjectViewsHeader: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { project: projectStore, commandPalette } = useMobxStore();
  const { currentProjectDetails } = projectStore;

  return (
    <>
      {workspaceSlug && projectId && (
        <CreateUpdateProjectViewModal
          isOpen={commandPalette.isCreateViewModalOpen}
          onClose={() => commandPalette.toggleCreateViewModal(false)}
          workspaceSlug={workspaceSlug.toString()}
          projectId={projectId.toString()}
        />
      )}
      <div className="relative flex w-full flex-shrink-0 flex-row z-10 h-[3.75rem] items-center justify-between gap-x-2 gap-y-4 border-b border-custom-border-200 bg-custom-sidebar-background-100 p-4">
        <div className="flex items-center gap-2 flex-grow w-full whitespace-nowrap overflow-ellipsis">
          <div>
            <Breadcrumbs>
              <Breadcrumbs.BreadcrumbItem
                type="text"
                label={currentProjectDetails?.name ?? "Project"}
                icon={
                  currentProjectDetails?.emoji ? (
                    <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded uppercase">
                      {renderEmoji(currentProjectDetails.emoji)}
                    </span>
                  ) : currentProjectDetails?.icon_prop ? (
                    <div className="h-7 w-7 flex-shrink-0 grid place-items-center">
                      {renderEmoji(currentProjectDetails.icon_prop)}
                    </div>
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
                icon={<PhotoFilterIcon className="h-4 w-4 text-custom-text-300" />}
                label="Views"
              />
            </Breadcrumbs>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div>
            <Button
              variant="primary"
              size="sm"
              prependIcon={<Plus className="h-3.5 w-3.5 stroke-2" />}
              onClick={() => commandPalette.toggleCreateViewModal(true)}
            >
              Create View
            </Button>
          </div>
        </div>
      </div>
    </>
  );
});
