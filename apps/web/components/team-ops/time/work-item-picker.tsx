/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import useSWR from "swr";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { InputField } from "@makeplane/propel/components/input-field";
import { CloseOutline } from "@makeplane/propel/icons";
import { useTranslation } from "@plane/i18n";
import type { TIssueSearchResponse } from "@plane/types";
// hooks
import useDebounce from "@/hooks/use-debounce";
// services
import { WorkspaceService } from "@/services/workspace.service";

const workspaceService = new WorkspaceService();

export type TPickedWorkItem = { id: string; name: string; key: string };

type Props = {
  workspaceSlug: string;
  value: TPickedWorkItem | null;
  onChange: (value: TPickedWorkItem | null) => void;
  disabled?: boolean;
};

const toPicked = (issue: TIssueSearchResponse): TPickedWorkItem => ({
  id: issue.id,
  name: issue.name,
  key: `${issue.project__identifier}-${issue.sequence_id}`,
});

/** Search box that resolves a work item of the workspace; the API re-checks access when it is used. */
export function WorkItemPicker(props: Props) {
  const { workspaceSlug, value, onChange, disabled } = props;
  // states
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  // hooks
  const { t } = useTranslation();
  const debouncedQuery = useDebounce(query, 300);

  const { data, isLoading } = useSWR(
    isOpen && debouncedQuery.trim() ? `TEAM_OPS_WORK_ITEM_SEARCH_${workspaceSlug}_${debouncedQuery}` : null,
    () => workspaceService.searchEntity(workspaceSlug, { count: 10, query_type: ["issue"], query: debouncedQuery })
  );

  // Leaving the picker with text typed but nothing chosen must not leave a stale list open.
  useEffect(() => {
    if (value) setIsOpen(false);
  }, [value]);

  if (value) {
    return (
      <div className="flex min-w-0 items-center justify-between gap-2 rounded-md border border-subtle px-3 py-2 text-13">
        <span className="min-w-0 truncate">
          <span className="font-medium text-tertiary">{value.key}</span> {value.name}
        </span>
        <IconButton
          icon={<Icon icon={CloseOutline} />}
          variant="ghost"
          size="sm"
          aria-label={t("team_ops.work_item.clear")}
          onClick={() => onChange(null)}
          disabled={disabled}
        />
      </div>
    );
  }

  const results = data?.issue ?? [];

  return (
    <div className="relative">
      <InputField
        type="text"
        size="lg"
        orientation="vertical"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
        }}
        placeholder={t("team_ops.work_item.placeholder")}
        aria-label={t("team_ops.work_item.placeholder")}
        disabled={disabled}
      />
      {isOpen && debouncedQuery.trim() && (
        <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-subtle bg-surface-1 py-1 shadow-raised-200">
          {results.length === 0 ? (
            <li className="px-3 py-2 text-13 text-tertiary">
              {isLoading ? t("team_ops.work_item.searching") : t("team_ops.work_item.no_results")}
            </li>
          ) : (
            results.map((issue) => (
              <li key={issue.id}>
                <button
                  type="button"
                  className="w-full truncate px-3 py-2 text-left text-13 hover:bg-layer-1"
                  onClick={() => {
                    onChange(toPicked(issue));
                    setQuery("");
                  }}
                >
                  <span className="font-medium text-tertiary">
                    {issue.project__identifier}-{issue.sequence_id}
                  </span>{" "}
                  {issue.name}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
