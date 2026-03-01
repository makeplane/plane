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

import { useMemo } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TPageVersion } from "@plane/types";
import { cn, renderFormattedDate, renderFormattedTime } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";
// local imports
import { VersionEditorRow } from "./version-editor-row";

type VersionHistoryItemProps = {
  getVersionLink: (versionID: string) => string;
  isVersionActive: boolean;
  version: TPageVersion;
};

export const VersionHistoryItem = observer(function VersionHistoryItem(props: VersionHistoryItemProps) {
  const { getVersionLink, isVersionActive, version } = props;
  // store hooks
  const { getUserDetails } = useMember();
  // translation
  const { t } = useTranslation();

  // Use Set for O(1) deduplication instead of repeated .includes() (js-set-map-lookups)
  const editorUserIds = useMemo(() => {
    // Prefer editors extracted from diff if available
    if (version.editors && version.editors.length > 0) {
      return version.editors;
    }
    // Fallback to available metadata - use Set for deduplication
    const ids = new Set<string>();
    if (version.owned_by) ids.add(version.owned_by);
    if (version.created_by) ids.add(version.created_by);
    if (version.updated_by) ids.add(version.updated_by);
    return Array.from(ids);
  }, [version.editors, version.owned_by, version.created_by, version.updated_by]);

  return (
    <li className="relative flex items-start gap-x-4 text-11 font-medium">
      {/* timeline icon */}
      <div className="relative size-6 flex-none grid place-items-center mt-2" aria-hidden="true">
        <div className="size-2 rounded-full bg-layer-3" />
      </div>
      {/* end timeline icon */}
      <Link
        href={getVersionLink(version.id)}
        className={cn("block flex-1 hover:bg-layer-transparent-hover rounded-md py-2 px-2", {
          "bg-layer-transparent-selected hover:bg-layer-transparent-selected": isVersionActive,
        })}
      >
        <p className="text-primary font-medium">
          {renderFormattedDate(version.last_saved_at)}, {renderFormattedTime(version.last_saved_at)}
        </p>
        {isVersionActive ? (
          <div className="mt-1.5 space-y-1">
            {editorUserIds.map((userId) => (
              <VersionEditorRow
                key={userId}
                userId={userId}
                getUserDetails={getUserDetails}
                deactivatedUserLabel={t("common.deactivated_user")}
              />
            ))}
          </div>
        ) : null}
      </Link>
    </li>
  );
});
