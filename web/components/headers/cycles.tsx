import { FC } from "react";
import { useRouter } from "next/router";
import { Plus } from "lucide-react";
// ui
import { Breadcrumbs, Button, ContrastIcon } from "@plane/ui";
// helpers
import { renderEmoji } from "helpers/emoji.helper";
// hooks
import { useMobxStore } from "lib/mobx/store-provider";

export interface ICyclesHeader {}

export const CyclesHeader: FC<ICyclesHeader> = (props) => {
  const {} = props;
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // store
  const { project: projectStore } = useMobxStore();
  const { currentProjectDetails } = projectStore;

  return (
    <div
      className={`relative z-10 flex w-full flex-shrink-0 flex-row items-center justify-between gap-x-2 gap-y-4 border-b border-custom-border-200 bg-custom-sidebar-background-100 p-4`}
    >
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
                  <span className="flex items-center justify-center h-4 w-4 rounded bg-gray-700 uppercase text-white">
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
      <div className="flex items-center gap-3">
        <Button
          variant="primary"
          prependIcon={<Plus />}
          onClick={() => {
            const e = new KeyboardEvent("keydown", { key: "q" });
            document.dispatchEvent(e);
          }}
        >
          Add Cycle
        </Button>
      </div>
    </div>
  );
};
