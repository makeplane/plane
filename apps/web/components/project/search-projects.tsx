/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { ExpandableSearch } from "@makeplane/propel/components/expandable-search";
import { useTranslation } from "@plane/i18n";
// hooks
import { useProjectFilter } from "@/hooks/store/use-project-filter";

export const ProjectSearch = observer(function ProjectSearch() {
  // i18n
  const { t } = useTranslation();
  // hooks
  const { searchQuery, updateSearchQuery } = useProjectFilter();

  return (
    <ExpandableSearch
      size="md"
      aria-label={t("common.search.label")}
      clearLabel={t("common.clear")}
      placeholder={t("common.search.label")}
      value={searchQuery}
      onValueChange={(value) => updateSearchQuery(value)}
    />
  );
});
