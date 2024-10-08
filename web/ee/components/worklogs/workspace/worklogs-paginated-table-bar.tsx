"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// plane web components
import { PaginationBar } from "@/plane-web/components/common/pagination-bar";
// hooks
import { useWorkspaceWorklogs } from "@/plane-web/hooks/store";

type TWorkspaceTablePaginationBar = {
  workspaceSlug: string;
};

export const WorkspaceTablePaginationBar: FC<TWorkspaceTablePaginationBar> = observer((props) => {
  const { workspaceSlug } = props;
  // hooks
  const { perPage, paginationInfo, getPreviousWorklogs, getNextWorklogs } = useWorkspaceWorklogs();

  const getPrevDownloads = async () => {
    try {
      if (!workspaceSlug) return;
      await getPreviousWorklogs(workspaceSlug);
    } catch (error) {
      console.error("Error while showing prev worklogs", error);
    }
  };

  const getNextDownloads = async () => {
    try {
      if (!workspaceSlug) return;
      await getNextWorklogs(workspaceSlug);
    } catch (error) {
      console.error("Error while showing next worklogs", error);
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
