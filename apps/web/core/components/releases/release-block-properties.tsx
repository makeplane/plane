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
import type { Release, ReleaseStatus } from "@plane/types";
import { getDate, renderFormattedPayloadDate } from "@plane/utils";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { DateDropdown } from "@/components/dropdowns/date";
import { useReleaseActions } from "@/hooks/releases/use-release-actions";
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
  const { updateRelease } = useReleaseActions(workspaceSlug);

  return (
    <div
      className={`relative flex flex-wrap ${isSidebarCollapsed ? "md:grow md:shrink-0" : "lg:grow lg:shrink-0"} items-center gap-2 whitespace-nowrap`}
    >
      <PropertyBlockWrapper>
        <ReleaseStateDropdown
          value={release.status ?? "unreleased"}
          onChange={(val) => updateRelease(release.id, { status: val as ReleaseStatus })}
          placeholder={t("state")}
        />
      </PropertyBlockWrapper>

      <PropertyBlockWrapper>
        <DateDropdown
          buttonVariant="border-with-text"
          className="h-6"
          value={getDate(release.release_date) ?? null}
          onChange={(val) => updateRelease(release.id, { release_date: val ? renderFormattedPayloadDate(val) : null })}
          placeholder={t("target_date")}
        />
      </PropertyBlockWrapper>

      <PropertyBlockWrapper>
        <MemberDropdown
          value={release.lead ?? null}
          onChange={(val) => updateRelease(release.id, { lead: val ?? null })}
          multiple={false}
          buttonVariant="border-with-text"
          placeholder={t("lead")}
          showUserDetails
        />
      </PropertyBlockWrapper>

      <PropertyBlockWrapper>
        <ReleaseLabelDropdown
          value={release.label_ids ?? []}
          onChange={(val) => updateRelease(release.id, { label_ids: val })}
          placeholder="Label"
        />
      </PropertyBlockWrapper>

      <PropertyBlockWrapper>
        <ReleaseTagDropdown
          value={release.tag ?? null}
          onChange={(val) => updateRelease(release.id, { tag: val })}
          placeholder="Tag"
        />
      </PropertyBlockWrapper>
    </div>
  );
});
