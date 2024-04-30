import { FC, useRef } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
// types
import { IProjectView } from "@plane/types";
// components
import { ListItem } from "@/components/core/list";
import { ViewListItemAction } from "@/components/views";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";

type Props = {
  view: IProjectView;
};

export const ProjectViewListItem: FC<Props> = observer((props) => {
  const { view } = props;
  // refs
  const parentRef = useRef(null);
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // store hooks
  const { isMobile } = usePlatformOS();

  return (
    <ListItem
      title={view.name}
      itemLink={`/${workspaceSlug}/projects/${projectId}/views/${view.id}`}
      actionableItems={<ViewListItemAction parentRef={parentRef} view={view} />}
      isMobile={isMobile}
      parentRef={parentRef}
    />
  );
});
