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
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { useTranslation } from "@plane/i18n";
import type { Release } from "@plane/types";
import { RELEASES } from "@/constants/fetch-keys";
import releaseService from "@/services/release.service";
import type { TIssueOperations } from "./root";
import { ReleaseDropdown } from "@/components/dropdowns/release/dropdown";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  issueOperations: TIssueOperations;
  releaseIds?: string[];
  disabled?: boolean;
  className?: string;
};

export const ReleaseSelect = observer(function ReleaseSelect(props: Props) {
  const {
    workspaceSlug,
    projectId,
    issueId,
    issueOperations,
    releaseIds: releaseIdsProp,
    disabled = false,
    className = "",
  } = props;
  const { t } = useTranslation();

  //TODO: make use of release store once it is implemented
  const { data: releases = [] } = useSWR<Release[]>(
    workspaceSlug ? RELEASES(workspaceSlug) : null,
    workspaceSlug ? () => releaseService.list(workspaceSlug) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  const derivedFromReleases = releases.filter((r) => r.work_item_ids?.includes(issueId)).map((r) => r.id);
  const effectiveReleaseIds = releaseIdsProp ?? derivedFromReleases;

  const handleChange = async (newIds: string | string[]) => {
    const ids = Array.isArray(newIds) ? newIds : newIds ? [newIds] : [];
    try {
      await issueOperations.update(workspaceSlug, projectId, issueId, { release_ids: ids });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("error.something_went_wrong") });
    }
  };

  return (
    <ReleaseDropdown
      workspaceSlug={workspaceSlug}
      value={effectiveReleaseIds}
      disabled={disabled}
      onChange={handleChange}
      className={className}
    />
  );
});
