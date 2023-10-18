import { FC, useState } from "react";
import { useRouter } from "next/router";
// icons
import { ArrowLeft, Link, Plus } from "lucide-react";
// components
import { CreateUpdateProjectViewModal } from "components/views";
// components
import { Breadcrumbs, BreadcrumbItem } from "@plane/ui";
// ui
import { PrimaryButton } from "components/ui";
// helpers
import { truncateText } from "helpers/string.helper";

interface IProjectViewsHeader {
  title: string | undefined;
}

export const ProjectViewsHeader: FC<IProjectViewsHeader> = (props) => {
  const { title } = props;
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // states
  const [createViewModal, setCreateViewModal] = useState(false);

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
              <ArrowLeft fontSize={14} strokeWidth={2} />
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
              <BreadcrumbItem title={`${truncateText(title ?? "Project", 32)} Cycles`} />
            </Breadcrumbs>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div>
            <PrimaryButton
              type="button"
              className="flex items-center gap-2"
              onClick={() => {
                const e = new KeyboardEvent("keydown", { key: "v" });
                document.dispatchEvent(e);
              }}
            >
              <Plus size={14} strokeWidth={2} />
              Create View
            </PrimaryButton>
          </div>
        </div>
      </div>
    </>
  );
};
