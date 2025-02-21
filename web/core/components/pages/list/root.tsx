import { FC } from "react";
import { observer } from "mobx-react";
// types
import { TPageNavigationTabs } from "@plane/types";
// components
import { ListLayout } from "@/components/core/list";
// plane web hooks
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";
// components
import { PageListBlock } from "./";

const storeType = EPageStoreType.PROJECT;

type TPagesListRoot = {
  pageType: TPageNavigationTabs;
};

export const ProjectPagesListRoot: FC<TPagesListRoot> = observer((props) => {
  const { pageType } = props;
  // store hooks
  const { getCurrentProjectFilteredPageIds } = usePageStore(storeType);
  // derived values
  const filteredPageIds = getCurrentProjectFilteredPageIds(pageType);

  if (!filteredPageIds) return <></>;
  return (
    <ListLayout>
      {filteredPageIds.map((pageId) => (
        <PageListBlock key={pageId} pageId={pageId} storeType={storeType} />
      ))}
    </ListLayout>
  );
});
