/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useRef } from "react";
import { observer } from "mobx-react";
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
  workspaceSlug: string;
  projectId: string;
};

export const ProjectViewListItem = observer(function ProjectViewListItem(props: Props) {
  const { view, workspaceSlug, projectId } = props;
  // refs
  const parentRef = useRef(null);
  // store hooks
  const { isMobile } = usePlatformOS();

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
      itemLink={`/${workspaceSlug}/projects/${projectId}/views/${view.id}`}
      actionableItems={
        <ViewListItemAction parentRef={parentRef} view={view} workspaceSlug={workspaceSlug} projectId={projectId} />
      }
      quickActionElement={
        <div className="block md:hidden">
          <ViewQuickActions parentRef={parentRef} projectId={projectId} view={view} workspaceSlug={workspaceSlug} />
        </div>
      }
      isMobile={isMobile}
      parentRef={parentRef}
    />
  );
});
