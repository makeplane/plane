import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { observer } from "mobx-react-lite";
import { ArrowLeft, Plus } from "lucide-react";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { CreateUpdateProjectViewModal } from "components/views";
// components
import { Breadcrumbs, BreadcrumbItem } from "@plane/ui";
// ui
import { PrimaryButton } from "components/ui";
// helpers
import { truncateText } from "helpers/string.helper";

export const ProjectViewsHeader: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // states
  const [createViewModal, setCreateViewModal] = useState(false);

  const { project: projectStore } = useMobxStore();

  const projectDetails =
    workspaceSlug && projectId
      ? projectStore.getProjectById(workspaceSlug.toString(), projectId.toString())
      : undefined;

  return (
    <>
      {workspaceSlug && projectId && (
        <CreateUpdateProjectViewModal
          isOpen={createViewModal}
          onClose={() => setCreateViewModal(false)}
          workspaceSlug={workspaceSlug.toString()}
          projectId={projectId.toString()}
        />
      )}
      <div
        className={`relative flex w-full flex-shrink-0 flex-row z-10 items-center justify-between gap-x-2 gap-y-4 border-b border-custom-border-200 bg-custom-sidebar-background-100 p-4`}
      >
        <div className="flex items-center gap-2 flex-grow w-full whitespace-nowrap overflow-ellipsis">
          <div className="block md:hidden">
            <button
              type="button"
              className="grid h-8 w-8 place-items-center rounded border border-custom-border-200"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-3 w-3" strokeWidth={2} />
            </button>
          </div>
          <div>
            <Breadcrumbs onBack={() => router.back()}>
              <BreadcrumbItem
                link={
                  <Link href={`/${workspaceSlug}/projects`}>
                    <a className={`border-r-2 border-custom-sidebar-border-200 px-3 text-sm `}>
                      <p>Projects</p>
                    </a>
                  </Link>
                }
              />
              <BreadcrumbItem title={`${truncateText(projectDetails?.name ?? "Project", 32)} Views`} />
            </Breadcrumbs>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div>
            <PrimaryButton type="button" className="flex items-center gap-2" onClick={() => setCreateViewModal(true)}>
              <Plus size={14} strokeWidth={2} />
              Create View
            </PrimaryButton>
          </div>
        </div>
      </div>
    </>
  );
});
