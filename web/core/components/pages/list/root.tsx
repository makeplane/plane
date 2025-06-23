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

type TPagesListRoot = {
  pageType: TPageNavigationTabs;
  storeType: EPageStoreType;
};

export const PagesListRoot: FC<TPagesListRoot> = observer((props) => {
  const { pageType, storeType } = props;
  // store hooks
  const { getCurrentProjectFilteredPageIdsByTab } = usePageStore(storeType);
  // derived values
  const filteredPageIds = getCurrentProjectFilteredPageIdsByTab(pageType);

  if (!filteredPageIds) return <></>;
  return (
    <ListLayout>
      {filteredPageIds.map((pageId) => (
        <PageListBlock key={pageId} pageId={pageId} storeType={storeType} />
      ))}
    </ListLayout>
  );
});
