/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useRef } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { LockIcon } from "lucide-react";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { ViewsIcon } from "@plane/propel/icons";
// types
import type { IProjectView } from "@plane/types";
// components
import { ListItem } from "@/components/core/list";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";
// local imports
import { ViewQuickActions } from "./quick-actions";
import { ViewListItemAction } from "./view-list-item-action";

type Props = {
  view: IProjectView;
};

export const ProjectViewListItem = observer(function ProjectViewListItem(props: Props) {
  const { view } = props;
  // refs
  const parentRef = useRef(null);
  // router
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const { isMobile } = usePlatformOS();

  const isDefault = view.is_default;

  return (
    <ListItem
      prependTitleElement={
        <>
          {view?.logo_props?.in_use ? (
            <Logo logo={view?.logo_props} size={16} type="lucide" />
          ) : (
            <ViewsIcon className="h-4 w-4 text-tertiary" />
          )}
        </>
      }
      title={view.name}
      appendTitleElement={
        isDefault ? (
          <span className="flex items-center gap-1 rounded bg-accent-primary/10 px-1.5 py-0.5 text-10 font-medium text-accent-primary">
            <LockIcon className="h-3 w-3" />
            Default
          </span>
        ) : undefined
      }
      itemLink={`/${workspaceSlug}/projects/${projectId}/views/${view.id}`}
      actionableItems={!isDefault ? <ViewListItemAction parentRef={parentRef} view={view} /> : undefined}
      quickActionElement={
        !isDefault ? (
          <div className="block md:hidden">
            <ViewQuickActions
              parentRef={parentRef}
              projectId={projectId.toString()}
              view={view}
              workspaceSlug={workspaceSlug.toString()}
            />
          </div>
        ) : undefined
      }
      isMobile={isMobile}
      parentRef={parentRef}
    />
  );
});
