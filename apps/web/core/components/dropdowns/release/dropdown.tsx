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
import useSWR from "swr";
import type { Release } from "@plane/types";
import { WORKSPACE_RELEASES } from "@/constants/fetch-keys";
import { useReleases } from "@/hooks/store/use-releases";
import { ReleaseDropdownBase } from "./base";
import type { TReleaseDropdownProps } from "./types";

export const ReleaseDropdown = observer(function ReleaseDropdown(props: TReleaseDropdownProps) {
  const { workspaceSlug, ...rest } = props;
  const {
    release: { isReleasesEnabled, fetchReleases },
  } = useReleases();
  const isReleaseAccessEnabled = workspaceSlug ? isReleasesEnabled(workspaceSlug) : false;

  const { data: releases = [] } = useSWR<Release[]>(
    workspaceSlug && isReleaseAccessEnabled ? WORKSPACE_RELEASES(workspaceSlug) : null,
    workspaceSlug && isReleaseAccessEnabled ? () => fetchReleases(workspaceSlug) : null,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
    }
  );

  if (!isReleaseAccessEnabled) return null;

  return <ReleaseDropdownBase {...rest} releases={releases} />;
});
