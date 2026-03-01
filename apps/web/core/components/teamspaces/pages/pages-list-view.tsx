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
// types
import type { TPageNavigationTabs } from "@plane/types";
// plane web hooks
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";
// components
import { TeamspacePagesListHeaderRoot } from "./header/index";
import { TeamspacePagesListRoot } from "./list/index";

const storeType = EPageStoreType.TEAMSPACE;

type TPageView = {
  pageType: TPageNavigationTabs;
  teamspaceId: string;
  workspaceSlug: string;
};

export const TeamspacePagesListView = observer(function TeamspacePagesListView(props: TPageView) {
  const { pageType, workspaceSlug, teamspaceId } = props;
  // store hooks
  const { isAnyPageAvailable } = usePageStore(storeType);

  return (
    <div className="relative w-full h-full overflow-hidden flex flex-col">
      {/* filters/search header */}
      {isAnyPageAvailable && (
        <TeamspacePagesListHeaderRoot pageType={pageType} teamspaceId={teamspaceId} workspaceSlug={workspaceSlug} />
      )}
      <TeamspacePagesListRoot pageType={pageType} workspaceSlug={workspaceSlug} teamspaceId={teamspaceId} />
    </div>
  );
});
