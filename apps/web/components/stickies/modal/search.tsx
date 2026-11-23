/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useMemo } from "react";
import { debounce } from "lodash-es";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { ExpandableSearch } from "@makeplane/propel/components/expandable-search";
import { useTranslation } from "@plane/i18n";
// hooks
import { useSticky } from "@/hooks/use-stickies";

export const StickySearch = observer(function StickySearch() {
  // router
  const { workspaceSlug } = useParams();
  // hooks
  const { searchQuery, updateSearchQuery, fetchWorkspaceStickies } = useSticky();
  const { t } = useTranslation();

  const fetchStickies = useCallback(async () => {
    if (!workspaceSlug) return;
    await fetchWorkspaceStickies(workspaceSlug.toString());
  }, [fetchWorkspaceStickies, workspaceSlug]);

  const debouncedSearch = useMemo(() => debounce(fetchStickies, 500), [fetchStickies]);

  useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch]);

  return (
    <div className="my-auto mr-1 flex items-center">
      <ExpandableSearch
        aria-label={t("stickies.search_placeholder")}
        clearLabel={t("common.clear")}
        size="md"
        placeholder={t("stickies.search_placeholder")}
        value={searchQuery}
        onValueChange={(value) => {
          updateSearchQuery(value);
          // an emptied search refetches right away instead of waiting out the debounce
          if (value.trim() === "") {
            debouncedSearch.cancel();
            void fetchStickies();
          } else void debouncedSearch();
        }}
      />
    </div>
  );
});
