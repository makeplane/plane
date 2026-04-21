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
import { toJS } from "mobx";
import { observer } from "mobx-react";
import type { Release, IBaseLayoutsBaseGroup } from "@plane/types";
import { DEFAULT_RELEASE_STATUS, RELEASE_STATES } from "@plane/constants";
import { ReleaseStateIcon } from "@plane/propel/icons";
import { BaseListLayout } from "@/components/base-layouts/list/layout";
import { useReleases } from "@/hooks/store/use-releases";
import { ReleaseBlock } from "./release-block";
import { ReleaseLayoutHOC } from "./release-layout-HOC";

type Props = {
  workspaceSlug: string;
};

export const ReleasesListLayout = observer(function ReleasesListLayout(props: Props) {
  const { workspaceSlug } = props;
  const {
    release: { getReleaseIdsByWorkspaceSlug, getReleaseById },
  } = useReleases();
  // derived states
  const releaseIds = getReleaseIdsByWorkspaceSlug(workspaceSlug);
  const { releasesMap, groupedReleaseIds } = useMemo(() => {
    const map: Record<string, Release> = {};
    const grouped: Record<string, string[]> = Object.fromEntries(Object.keys(RELEASE_STATES).map((key) => [key, []]));
    for (const releaseId of releaseIds) {
      const release = toJS(getReleaseById(releaseId));
      if (!release) continue;
      map[releaseId] = release;
      const status = release.status ?? DEFAULT_RELEASE_STATUS;
      grouped[status]?.push(releaseId);
    }
    return { releasesMap: map, groupedReleaseIds: grouped };
  }, [releaseIds, getReleaseById]);

  const groups: IBaseLayoutsBaseGroup[] = useMemo(() => {
    return Object.values(RELEASE_STATES).map((state) => ({
      id: state.key,
      name: state.title,
      icon: state.color ? <ReleaseStateIcon className="h-4 w-4 shrink-0" color={state.color} /> : undefined,
    }));
  }, []);

  const renderItem = useCallback(
    (release: Release) => <ReleaseBlock key={release.id} release={release} workspaceSlug={workspaceSlug} />,
    [workspaceSlug]
  );

  return (
    <ReleaseLayoutHOC workspaceSlug={workspaceSlug}>
      <BaseListLayout<Release>
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
