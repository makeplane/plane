import { FC } from "react";
import useSWR from "swr";

import { useRouter } from "next/router";
import Link from "next/link";

import { ArrowLeft } from "lucide-react";
// ui
import { BreadcrumbItem, Breadcrumbs } from "@plane/ui";
// hooks
import { observer } from "mobx-react-lite";
// services
import { WorkspaceService } from "services/workspace.service";
// helpers
import { truncateText } from "helpers/string.helper";
// constant
import { WORKSPACE_DETAILS } from "constants/fetch-keys";

const workspaceService = new WorkspaceService();

export interface IWorkspaceSettingHeader {
  title: string;
}

export const WorkspaceSettingHeader: FC<IWorkspaceSettingHeader> = observer((props) => {
  const { title } = props;
  const router = useRouter();

  const { workspaceSlug } = router.query;

  const { data: activeWorkspace } = useSWR(workspaceSlug ? WORKSPACE_DETAILS(workspaceSlug as string) : null, () =>
    workspaceSlug ? workspaceService.getWorkspace(workspaceSlug as string) : null
  );

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
                <Link href={`/${workspaceSlug}`}>
                  <a className={`border-r-2 border-custom-sidebar-border-200 px-3 text-sm `}>
                    <p className="truncate">{`${truncateText(activeWorkspace?.name ?? "Workspace", 32)}`}</p>
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
