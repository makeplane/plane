"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// plane web components
import { PaginationBar } from "@/plane-web/components/common/pagination-bar";
// hooks
import { useWorkspaceWorklogDownloads } from "@/plane-web/hooks/store";

type TWorkspaceWorklogDownloadPaginationBar = {
  workspaceSlug: string;
};

export const WorkspaceWorklogDownloadPaginationBar: FC<TWorkspaceWorklogDownloadPaginationBar> = observer((props) => {
  const { workspaceSlug } = props;
  // hooks
  const { perPage, paginationInfo, getPreviousWorklogDownloads, getNextWorklogDownloads } =
    useWorkspaceWorklogDownloads();

  const getPrevDownloads = async () => {
    try {
      if (!workspaceSlug) return;
      await getPreviousWorklogDownloads(workspaceSlug);
    } catch (error) {
      console.error("Error while showing prev download", error);
    }
  };

  const getNextDownloads = async () => {
    try {
      if (!workspaceSlug) return;
      await getNextWorklogDownloads(workspaceSlug);
    } catch (error) {
      console.error("Error while showing next download", error);
    }
  };

  if (!paginationInfo) return <></>;
  return (
    <PaginationBar
      perPage={perPage}
      paginationInfo={paginationInfo}
      onPrevClick={getPrevDownloads}
      onNextClick={getNextDownloads}
    />
  );
});
