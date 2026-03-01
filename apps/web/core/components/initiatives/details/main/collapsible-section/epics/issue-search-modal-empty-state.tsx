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

import type { FC } from "react";
import { useTheme } from "next-themes";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { ISearchIssueResponse } from "@plane/types";
// assets
import issuesDark from "@/app/assets/empty-state/search/issues-dark.webp?url";
import issuesLight from "@/app/assets/empty-state/search/issues-light.webp?url";
import searchDark from "@/app/assets/empty-state/search/search-dark.webp?url";
import searchLight from "@/app/assets/empty-state/search/search-light.webp?url";
// components
import { SimpleEmptyState } from "@/components/empty-state/simple-empty-state-root";

type Props = {
  issues: ISearchIssueResponse[];
  searchTerm: string;
  debouncedSearchTerm: string;
  isSearching: boolean;
};

export function EpicSearchModalEmptyState({ issues, searchTerm, debouncedSearchTerm, isSearching }: Props) {
  // plane hooks
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  // derived values
  const searchResolvedPath = resolvedTheme === "light" ? searchLight : searchDark;
  const epicsResolvedPath = resolvedTheme === "light" ? issuesLight : issuesDark;

  function EmptyStateContainer({ children }: { children: React.ReactNode }) {
    return <div className="flex flex-col items-center justify-center px-3 py-8 text-center">{children}</div>;
  }

  if (issues.length === 0 && searchTerm !== "" && debouncedSearchTerm !== "" && !isSearching) {
    return (
      <EmptyStateContainer>
        <SimpleEmptyState title={t("epic_relation.empty_state.no_epics.title")} assetPath={epicsResolvedPath} />
      </EmptyStateContainer>
    );
  } else if (issues.length === 0) {
    return (
      <EmptyStateContainer>
        <SimpleEmptyState title={t("epic_relation.empty_state.search.title")} assetPath={searchResolvedPath} />
      </EmptyStateContainer>
    );
  }
}
