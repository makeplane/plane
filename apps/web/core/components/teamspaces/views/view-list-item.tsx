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

import type { FC } from "react";
import { useRef } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { ViewsIcon } from "@plane/propel/icons";
// plane imports
import type { TTeamspaceView } from "@plane/types";
// components
import { ListItem } from "@/components/core/list";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";
// local imports
import { TeamspaceViewQuickActions } from "./quick-actions";
import { TeamspaceViewListItemAction } from "./view-list-item-action";

type Props = {
  teamspaceId: string;
  view: TTeamspaceView;
};

export const TeamspaceViewListItem = observer(function TeamspaceViewListItem(props: Props) {
  const { teamspaceId, view } = props;
  // refs
  const parentRef = useRef(null);
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { isMobile } = usePlatformOS();
  // derived values
  const detailPageLink = `/${workspaceSlug}/teamspaces/${view.team}/views/${view.id}`;

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
      itemLink={detailPageLink}
      actionableItems={<TeamspaceViewListItemAction parentRef={parentRef} teamspaceId={teamspaceId} view={view} />}
      quickActionElement={
        <div className="block md:hidden">
          <TeamspaceViewQuickActions
            parentRef={parentRef}
            teamspaceId={teamspaceId}
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
