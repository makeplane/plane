/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { ExpandableSearch } from "@makeplane/propel/components/expandable-search";
import { useTranslation } from "@plane/i18n";

type Props = {
  searchQuery: string;
  updateSearchQuery: (val: string) => void;
};

export function PageSearchInput(props: Props) {
  const { searchQuery, updateSearchQuery } = props;
  // plane hooks
  const { t } = useTranslation();

  return (
    <ExpandableSearch
      aria-label={t("search")}
      clearLabel={t("common.clear")}
      size="md"
      placeholder="Search pages"
      value={searchQuery}
      onValueChange={(value) => updateSearchQuery(value)}
    />
  );
}
