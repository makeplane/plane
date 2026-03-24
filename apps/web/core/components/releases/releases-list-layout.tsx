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

import { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
import type { Release, IBaseLayoutsBaseGroup, IBaseLayoutsListItem } from "@plane/types";
import { RELEASE_STATES } from "@plane/constants";
import { ReleaseStateIcon } from "@plane/propel/icons";
import { BaseListLayout } from "@/components/base-layouts/list/layout";
import { useReleases } from "@/hooks/store/use-releases";
import { ReleaseBlock } from "./release-block";
import { ReleaseLayoutHOC } from "./release-layout-HOC";

type ReleaseListItem = Release & IBaseLayoutsListItem;

export const ReleasesListLayout = observer(function ReleasesListLayout() {
  const { release: releaseStore } = useReleases();

  const releasesMap: Record<string, ReleaseListItem> = {};
  const groupedReleaseIds: Record<string, string[]> = { unreleased: [], released: [], cancelled: [] };

  releaseStore.releasesMap.forEach((release) => {
    releasesMap[release.id] = release as unknown as ReleaseListItem;
    const status = release.status ?? "unreleased";
    if (groupedReleaseIds[status]) {
      groupedReleaseIds[status].push(release.id);
    }
  });

  const groups: IBaseLayoutsBaseGroup[] = useMemo(() => {
    return Object.values(RELEASE_STATES).map((state) => ({
      id: state.key,
      name: state.title,
      icon: state.color ? <ReleaseStateIcon className="h-4 w-4 shrink-0" color={state.color} /> : undefined,
    }));
  }, []);

  const renderItem = useCallback((release: ReleaseListItem) => <ReleaseBlock key={release.id} release={release} />, []);

  return (
    <ReleaseLayoutHOC>
      <BaseListLayout<ReleaseListItem>
        items={releasesMap}
        groupedItemIds={groupedReleaseIds}
        groups={groups}
        renderItem={renderItem}
        showEmptyGroups
        enableDragDrop
      />
    </ReleaseLayoutHOC>
  );
});
