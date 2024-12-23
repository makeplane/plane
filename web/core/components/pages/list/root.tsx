import { FC } from "react";
import { observer } from "mobx-react";
// types
import { TPageNavigationTabs } from "@plane/types";
// components
import { ListLayout } from "@/components/core/list";
// hooks
import { useProjectPage, useProjectPages } from "@/hooks/store";
// components
import { PageListBlock } from "./";

type TPagesListRoot = {
  pageType: TPageNavigationTabs;
};

export const PagesListRoot: FC<TPagesListRoot> = observer((props) => {
  const { pageType } = props;
  // store hooks
  const { getCurrentProjectFilteredPageIds } = useProjectPages();
  // derived values
  const filteredPageIds = getCurrentProjectFilteredPageIds(pageType);

  if (!filteredPageIds) return <></>;
  return (
    <ListLayout>
      {filteredPageIds.map((pageId) => (
        <PageListBlock key={pageId} pageId={pageId} usePage={useProjectPage} />
      ))}
    </ListLayout>
  );
});
