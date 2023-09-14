import { useRouter } from "next/router";

import useSWR from "swr";

// services
import pagesService from "services/pages.service";
// components
import { PagesView } from "components/pages";
// types
import { TPagesListProps } from "./types";
// fetch-keys
import { MY_PAGES_LIST } from "constants/fetch-keys";

export const MyPagesList: React.FC<TPagesListProps> = ({ viewType }) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { data: pages } = useSWR(
    workspaceSlug && projectId ? MY_PAGES_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () =>
          pagesService.getPagesWithParams(
            workspaceSlug as string,
            projectId as string,
            "created_by_me"
          )
      : null
  );

  return <PagesView pages={pages} viewType={viewType} />;
};
