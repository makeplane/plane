"use client";

import { FC, MouseEvent } from "react";
import { Loader, RefreshCcw } from "lucide-react";
import { Button } from "@plane/ui";
// plane web constants
import { EWorklogDownloadLoader, EWorklogDownloadQueryParamType } from "@/plane-web/constants/workspace-worklog";
// hooks
import { useWorkspaceWorklogDownloads } from "@/plane-web/hooks/store";

type TWorkspaceWorklogDownloadRefresh = {
  workspaceSlug: string;
};

export const WorkspaceWorklogDownloadRefresh: FC<TWorkspaceWorklogDownloadRefresh> = (props) => {
  const { workspaceSlug } = props;
  // hooks
  const { loader, paginationInfo, getWorkspaceWorklogDownloads } = useWorkspaceWorklogDownloads();

  const refreshStatus = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (!workspaceSlug) return;
      await getWorkspaceWorklogDownloads(
        workspaceSlug,
        EWorklogDownloadLoader.MUTATION_LOADER,
        EWorklogDownloadQueryParamType.CURRENT
      );
    } catch (error) {
      console.error("Error while refreshing download status", error);
    }
  };

  const isLoaderButtonDisabled = loader === EWorklogDownloadLoader.MUTATION_LOADER;

  if (!paginationInfo) return <></>;
  return (
    <Button
      size="sm"
      variant="neutral-primary"
      className="whitespace-nowrap border-none !px-1"
      onClick={refreshStatus}
      disabled={isLoaderButtonDisabled}
    >
      <div className="flex items-center gap-1.5">
        {isLoaderButtonDisabled ? <Loader size={12} className="animate-spin" /> : <RefreshCcw size={12} />}
        {isLoaderButtonDisabled && <div>Refreshing</div>}
      </div>
    </Button>
  );
};
