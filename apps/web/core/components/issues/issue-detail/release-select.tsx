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
// plane imports
import { useTranslation } from "@plane/i18n";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { Release } from "@plane/types";
// constants
import { RELEASES } from "@/constants/fetch-keys";
// components
import { ReleaseDropdown } from "@/components/dropdowns/release/dropdown";
// services
import releaseService from "@/services/release.service";
import type { TReleaseDropdownBaseProps } from "@/components/dropdowns/release/types";

type Props = {
  workspaceSlug: string;
  onChange: (updatedIds: string[]) => Promise<void>;
  issueId: string;
  releaseIds?: string[];
} & Pick<
  TReleaseDropdownBaseProps,
  | "buttonContainerClassName"
  | "buttonClassName"
  | "buttonVariant"
  | "className"
  | "disabled"
  | "dropdownArrow"
  | "dropdownArrowClassName"
  | "hideIcon"
  | "onClose"
  | "showCount"
>;

export const ReleaseSelect = observer(function ReleaseSelect({
  workspaceSlug,
  issueId,
  onChange,
  releaseIds: releaseIdsProp,
  disabled = false,
  className = "",
  buttonClassName = "",
  buttonVariant = "transparent-with-text",
  buttonContainerClassName = "",
  dropdownArrow,
  dropdownArrowClassName = "",
  hideIcon,
  onClose,
  showCount,
}: Props) {
  const { t } = useTranslation();

  //TODO: make use of release store once it is implemented
  const { data: releases = [] } = useSWR<Release[]>(
    workspaceSlug ? RELEASES(workspaceSlug) : null,
    workspaceSlug ? () => releaseService.list(workspaceSlug) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  const effectiveReleaseIds =
    releaseIdsProp ?? releases.filter((r) => r.work_item_ids?.includes(issueId)).map((r) => r.id);

  const handleChange = async (newIds: string | string[]) => {
    const ids = Array.isArray(newIds) ? newIds : newIds ? [newIds] : [];
    try {
      await onChange(ids);
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
      buttonContainerClassName={buttonContainerClassName}
      buttonClassName={buttonClassName}
      buttonVariant={buttonVariant}
      dropdownArrow={dropdownArrow}
      dropdownArrowClassName={dropdownArrowClassName}
      hideIcon={hideIcon}
      onClose={onClose}
      showCount={showCount}
    />
  );
});
