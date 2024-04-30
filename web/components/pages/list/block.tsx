import { FC } from "react";
import { observer } from "mobx-react";
// components
import { ListItem } from "@/components/core/list";
import { BlockItemAction } from "@/components/pages/list";
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
  // hooks
  const { name } = usePage(pageId);
  const { isMobile } = usePlatformOS();

  return (
    <ListItem
      title={name ?? ""}
      itemLink={`/${workspaceSlug}/projects/${projectId}/pages/${pageId}`}
      actionableItems={<BlockItemAction workspaceSlug={workspaceSlug} projectId={projectId} pageId={pageId} />}
      isMobile={isMobile}
    />
  );
});
