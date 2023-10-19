import { FC } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

import { ArrowLeft } from "lucide-react";
// ui
import { BreadcrumbItem, Breadcrumbs } from "@plane/ui";
// helper
import { truncateText } from "helpers/string.helper";
// hooks
import { useMobxStore } from "lib/mobx/store-provider";
import { observer } from "mobx-react-lite";

export interface IProjectSettingHeader {
  title: string;
}

export const ProjectSettingHeader: FC<IProjectSettingHeader> = observer((props) => {
  const { title } = props;
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // store
  const { project: projectStore } = useMobxStore();
  const projectDetails = projectId ? projectStore.project_details[projectId.toString()] : null;

  return (
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
                <Link href={`/${workspaceSlug}/projects/${projectDetails?.id}/issues`}>
                  <a className={`border-r-2 border-custom-sidebar-border-200 px-3 text-sm `}>
                    <p className="truncate">{`${truncateText(projectDetails?.name ?? "Project", 32)}`}</p>
                  </a>
                </Link>
              }
            />
            <BreadcrumbItem title={title} unshrinkTitle />
          </Breadcrumbs>
        </div>
      </div>
    </div>
  );
});
