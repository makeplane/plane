import { FC, useRef } from "react";
import { observer } from "mobx-react";
// components
import { ListItem } from "@/components/core/list";
import { BlockItemAction } from "@/components/pages/list";
// helpers
import { getPageName } from "@/helpers/page.helper";
// hooks
import { usePage } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";

type TPageListBlock = {
  workspaceSlug: string;
  projectId: string;
  pageId: string;
};

export const PageListBlock: FC<TPageListBlock> = observer((props) => {
  const { workspaceSlug, projectId, pageId } = props;
  // refs
  const parentRef = useRef(null);
  // hooks
  const { name } = usePage(pageId);
  const { isMobile } = usePlatformOS();

  return (
    <ListItem
      title={getPageName(name)}
      itemLink={`/${workspaceSlug}/projects/${projectId}/pages/${pageId}`}
      actionableItems={
        <BlockItemAction workspaceSlug={workspaceSlug} projectId={projectId} pageId={pageId} parentRef={parentRef} />
      }
      isMobile={isMobile}
      parentRef={parentRef}
    />
  );
});
