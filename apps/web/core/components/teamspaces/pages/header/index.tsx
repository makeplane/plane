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

import { observer } from "mobx-react";
// plane imports
import type { TPageNavigationTabs } from "@plane/types";
import { BasePagesListHeaderRoot } from "@/components/pages/header/base";
// plane web hooks
import { EPageStoreType } from "@/plane-web/hooks/store";
// local imports
import { TeamspacePageTabNavigation } from "./tab-navigation";

type Props = {
  pageType: TPageNavigationTabs;
  teamspaceId: string;
  workspaceSlug: string;
};

export const TeamspacePagesListHeaderRoot = observer(function TeamspacePagesListHeaderRoot(props: Props) {
  const { pageType, teamspaceId, workspaceSlug } = props;

  return (
    <BasePagesListHeaderRoot
      storeType={EPageStoreType.TEAMSPACE}
      tabNavigationComponent={
        <TeamspacePageTabNavigation workspaceSlug={workspaceSlug} teamspaceId={teamspaceId} pageType={pageType} />
      }
    />
  );
});
