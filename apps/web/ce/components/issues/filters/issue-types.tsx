/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * Modified by Okręgowa Spółdzielnia Mleczarska w Piątnicy in 2026.
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Layers } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { SwitcherIcon } from "@/components/common/switcher-label";
import { FilterHeader, FilterOption } from "@/components/issues/issue-layouts/filters";
import { useWorkspaceIssueTypes } from "@/plane-web/hooks/use-workspace-issue-types";

type Props = {
  appliedFilters: string[] | null;
  handleUpdate: (val: string) => void;
  searchQuery: string;
};

export const FilterIssueTypes = observer(function FilterIssueTypes(props: Props) {
  const { appliedFilters, handleUpdate, searchQuery } = props;
  const { t } = useTranslation();
  const { workspaceSlug } = useParams();
  const [previewEnabled, setPreviewEnabled] = useState(true);
  const { types, isLoading } = useWorkspaceIssueTypes(workspaceSlug?.toString());

  const appliedFiltersCount = appliedFilters?.length ?? 0;
  const filtered = types.filter((row) => row.name.toLowerCase().includes(searchQuery.trim().toLowerCase()));

  if (types.length === 0 && !isLoading) return null;

  return (
    <>
      <FilterHeader
        title={`${t("common.display.properties.issue_type")}${appliedFiltersCount > 0 ? ` (${appliedFiltersCount})` : ""}`}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled ? (
        <div>
          {filtered.length > 0 ? (
            filtered.map((row) => (
              <FilterOption
                key={row.id}
                isChecked={appliedFilters?.includes(row.id) ?? false}
                onClick={() => handleUpdate(row.id)}
                icon={<SwitcherIcon logo_props={row.logo_props} LabelIcon={Layers} size={12} />}
                title={row.name}
              />
            ))
          ) : (
            <p className="text-11 text-placeholder italic">{t("common.search.no_matches_found")}</p>
          )}
        </div>
      ) : null}
    </>
  );
});
