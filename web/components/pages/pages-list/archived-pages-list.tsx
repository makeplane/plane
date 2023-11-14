
import { useRouter } from "next/router";

import useSWR from "swr";

// services
import { PageService } from "services/page.service";
// components
import { PagesView } from "components/pages";
// types
import { TPagesListProps } from "./types";
// fetch-keys
import { ARCHIVED_PAGES_LIST } from "constants/fetch-keys";

// services
const pageService = new PageService();

export const ArchivedPagesList: React.FC<TPagesListProps> = ({ viewType }) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { data: pages } = useSWR(
    workspaceSlug && projectId ? ARCHIVED_PAGES_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () => pageService.getArchivedPages(workspaceSlug as string, projectId as string)
      : null
  );

  return <PagesView pages={pages} viewType={viewType} />;
};
