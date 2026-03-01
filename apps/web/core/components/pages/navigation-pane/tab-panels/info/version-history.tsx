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

import { useCallback } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
// components
import type { TPageRootHandlers } from "@/components/pages/editor/page-root";
// hooks
import { useQueryParams } from "@/hooks/use-query-params";
// store
import type { TPageInstance } from "@/store/pages/base-page";
// local imports
import { PAGE_NAVIGATION_PANE_VERSION_QUERY_PARAM } from "../..";
import { VersionHistoryItem } from "./version-history-item";

type Props = {
  page: TPageInstance;
  versionHistory: Pick<TPageRootHandlers, "fetchAllVersions" | "fetchVersionDetails">;
};

export const PageNavigationPaneInfoTabVersionHistory = observer(function PageNavigationPaneInfoTabVersionHistory(
  props: Props
) {
  const { page, versionHistory } = props;
  // navigation
  const searchParams = useSearchParams();
  const activeVersion = searchParams.get(PAGE_NAVIGATION_PANE_VERSION_QUERY_PARAM);
  // derived values
  const { id } = page;
  // translation
  const { t } = useTranslation();
  // query params
  const { updateQueryParams } = useQueryParams();
  // fetch all versions
  const { data: versionsList } = useSWR(
    id ? `PAGE_VERSIONS_LIST_${id}` : null,
    id ? () => versionHistory.fetchAllVersions(id) : null
  );

  const getVersionLink = useCallback(
    (versionID?: string) => {
      if (versionID) {
        return updateQueryParams({
          paramsToAdd: { [PAGE_NAVIGATION_PANE_VERSION_QUERY_PARAM]: versionID },
        });
      } else {
        return updateQueryParams({
          paramsToRemove: [PAGE_NAVIGATION_PANE_VERSION_QUERY_PARAM],
        });
      }
    },
    [updateQueryParams]
  );

  return (
    <div>
      <p className="text-11 font-medium text-secondary">{t("page_navigation_pane.tabs.info.version_history.label")}</p>
      <div className="mt-3">
        <ul className="relative">
          {/* timeline line */}
          <div className={cn("absolute left-0 top-0 h-full flex w-6 justify-center")} aria-hidden="true">
            <div className="w-px bg-layer-3" />
          </div>
          {/* end timeline line */}
          <li className="relative flex items-start gap-x-4 text-11 font-medium">
            {/* timeline icon */}
            <div
              className="relative size-6 flex-none rounded-full grid place-items-center bg-accent-primary/20 mt-2"
              aria-hidden="true"
            >
              <div className="size-2.5 rounded-full bg-accent-primary/40" />
            </div>
            {/* end timeline icon */}
            <Link
              href={getVersionLink()}
              className={cn(
                "flex-1 bg-layer-transparent hover:bg-layer-transparent-hover rounded-md py-2 px-2 font-medium underline",
                {
                  "bg-layer-transparent-selected hover:bg-layer-transparent-selected": !activeVersion,
                }
              )}
            >
              {t("page_navigation_pane.tabs.info.version_history.current_version")}
            </Link>
          </li>
          {versionsList?.map((version) => (
            <VersionHistoryItem
              key={version.id}
              getVersionLink={getVersionLink}
              isVersionActive={activeVersion === version.id}
              version={version}
            />
          ))}
        </ul>
      </div>
    </div>
  );
});
