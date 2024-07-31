"use client";

import { FC, useRef } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Layers } from "lucide-react";
// types
import { IProjectView } from "@plane/types";
// components
import { Logo } from "@/components/common";
import { ListItem } from "@/components/core/list";
import { ViewListItemAction, ViewQuickActions } from "@/components/views";
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
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const { isMobile } = usePlatformOS();

  return (
    <ListItem
      prependTitleElement={
        <>
          {view?.logo_props?.in_use ? (
            <Logo logo={view?.logo_props} size={16} type="lucide" />
          ) : (
            <Layers className="h-4 w-4 text-custom-text-300" />
          )}
        </>
      }
      title={view.name}
      itemLink={`/${workspaceSlug}/projects/${projectId}/views/${view.id}`}
      actionableItems={<ViewListItemAction parentRef={parentRef} view={view} />}
      quickActionElement={
        <div className="block md:hidden">
          <ViewQuickActions
            parentRef={parentRef}
            projectId={projectId.toString()}
            view={view}
            workspaceSlug={workspaceSlug.toString()}
          />
        </div>
      }
      isMobile={isMobile}
      parentRef={parentRef}
    />
  );
});
