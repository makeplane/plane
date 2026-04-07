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
import { useTranslation } from "@plane/i18n";
import type { Release, ReleaseStatus, ReleaseWrite } from "@plane/types";
import { getDate, renderFormattedPayloadDate } from "@plane/utils";
import { mutate } from "swr";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { DateDropdown } from "@/components/dropdowns/date";
import { WORKSPACE_RELEASES } from "@/constants/fetch-keys";
import { useReleases } from "@/hooks/store/use-releases";
import { ReleaseLabelDropdown } from "./modal/release-label-dropdown";
import { ReleaseStateDropdown } from "./modal/release-state-dropdown";
import { ReleaseTagDropdown } from "./modal/release-tag-dropdown";

type Props = {
  release: Release;
  isSidebarCollapsed: boolean | undefined;
  workspaceSlug: string;
};

const PropertyBlockWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="h-6">
    <div className="h-full text-11 flex items-center gap-2">{children}</div>
  </div>
);

export const ReleaseBlockProperties = observer(function ReleaseBlockProperties(props: Props) {
  const { release, isSidebarCollapsed, workspaceSlug } = props;
  const { t } = useTranslation();
  const { release: releaseStore } = useReleases();

  const handleUpdate = async (patch: ReleaseWrite) => {
    try {
      await releaseStore.updateRelease(workspaceSlug, release.id, patch);
      const { description_html: _html, description_json: _json, ...optimisticPatch } = patch;
      await mutate(
        WORKSPACE_RELEASES(workspaceSlug),
        (current: Release[] | undefined) =>
          (current ?? []).map((r) => (r.id === release.id ? { ...r, ...optimisticPatch } : r)),
        { revalidate: false }
      );
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("error.something_went_wrong") });
    }
  };

  return (
    <div
      className={`relative flex flex-wrap ${isSidebarCollapsed ? "md:grow md:shrink-0" : "lg:grow lg:shrink-0"} items-center gap-2 whitespace-nowrap`}
    >
      <PropertyBlockWrapper>
        <ReleaseStateDropdown
          value={release.status ?? "unreleased"}
          onChange={(val) => handleUpdate({ status: val })}
          placeholder={t("state")}
        />
      </PropertyBlockWrapper>

      <PropertyBlockWrapper>
        <DateDropdown
          buttonVariant="border-with-text"
          className="h-6"
          value={getDate(release.release_date) ?? null}
          onChange={(val) => handleUpdate({ release_date: val ? renderFormattedPayloadDate(val) : null })}
          placeholder={t("target_date")}
        />
      </PropertyBlockWrapper>

      <PropertyBlockWrapper>
        <MemberDropdown
          value={release.lead ?? null}
          onChange={(val) => handleUpdate({ lead: val ?? null })}
          multiple={false}
          buttonVariant="border-with-text"
          placeholder={t("lead")}
          showUserDetails
        />
      </PropertyBlockWrapper>

      <PropertyBlockWrapper>
        <ReleaseLabelDropdown
          value={release.label_ids ?? []}
          onChange={(val) => handleUpdate({ label_ids: val })}
          placeholder="Label"
        />
      </PropertyBlockWrapper>

      <PropertyBlockWrapper>
        <ReleaseTagDropdown
          value={release.tag ?? null}
          onChange={(val) => handleUpdate({ tag: val })}
          placeholder="Tag"
        />
      </PropertyBlockWrapper>
    </div>
  );
});
