/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { useRef, useCallback, useState } from "react";
import { observer } from "mobx-react";
import { CloseOutline, SearchOutline } from "@makeplane/propel/icons";
// plane imports
import type { TProjectDisplayFilters, TProjectFilters } from "@plane/types";
// components
import { FilterOption } from "@/components/issues/issue-layouts/filters";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";
// local imports
import { FilterAccess } from "./access";
import { FilterCreatedDate } from "./created-at";
import { FilterLead } from "./lead";
import { FilterMembers } from "./members";

type Props = {
  displayFilters: TProjectDisplayFilters;
  filters: TProjectFilters;
  handleFiltersUpdate: (key: keyof TProjectFilters, value: string | string[]) => void;
  handleDisplayFiltersUpdate: (updatedDisplayProperties: Partial<TProjectDisplayFilters>) => void;
  memberIds?: string[] | undefined;
};

export const ProjectFiltersSelection = observer(function ProjectFiltersSelection(props: Props) {
  const { t } = useTranslation();

  const { displayFilters, filters, handleFiltersUpdate, handleDisplayFiltersUpdate, memberIds } = props;
  // states
  const [filtersSearchQuery, setFiltersSearchQuery] = useState("");
  // store
  const { isMobile } = usePlatformOS();
  const initialFocusTarget = useRef<HTMLElement | null>(null);
  // Focus each newly mounted field once; viewport/prop changes must not steal focus.
  const focusInputOnMount = useCallback(
    (element: HTMLElement | null) => {
      if (!element || initialFocusTarget.current === element) return;
      initialFocusTarget.current = element;
      if (isMobile) return;
      const input = element instanceof HTMLInputElement ? element : element?.querySelector("input");
      input?.focus();
    },
    [isMobile]
  );

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="bg-surface-1 p-2.5 pb-0">
        <div className="flex items-center gap-1.5 rounded-sm border-[0.5px] border-subtle bg-surface-2 px-1.5 py-1 text-11">
          <SearchOutline className="text-placeholder" width={12} height={12} />
          <input
            type="text"
            className="w-full bg-surface-2 outline-none placeholder:text-placeholder"
            placeholder={t("search")}
            value={filtersSearchQuery}
            onChange={(e) => setFiltersSearchQuery(e.target.value)}
            ref={focusInputOnMount}
          />
          {filtersSearchQuery !== "" && (
            <button type="button" className="grid place-items-center" onClick={() => setFiltersSearchQuery("")}>
              <CloseOutline className="text-tertiary" height={12} width={12} />
            </button>
          )}
        </div>
      </div>
      <div className="vertical-scrollbar scrollbar-sm h-full w-full divide-y divide-subtle-1 overflow-y-auto px-2.5">
        <div className="py-2">
          <FilterOption
            isChecked={!!displayFilters.my_projects}
            onClick={() =>
              handleDisplayFiltersUpdate({
                my_projects: !displayFilters.my_projects,
              })
            }
            title={t("workspace_projects.scope.my_projects")}
          />
        </div>

        {/* access */}
        <div className="py-2">
          <FilterAccess
            appliedFilters={filters.access ?? null}
            handleUpdate={(val) => handleFiltersUpdate("access", val)}
            searchQuery={filtersSearchQuery}
          />
        </div>

        {/* lead */}
        <div className="py-2">
          <FilterLead
            appliedFilters={filters.lead ?? null}
            handleUpdate={(val) => handleFiltersUpdate("lead", val)}
            searchQuery={filtersSearchQuery}
            memberIds={memberIds}
          />
        </div>

        {/* members */}
        <div className="py-2">
          <FilterMembers
            appliedFilters={filters.members ?? null}
            handleUpdate={(val) => handleFiltersUpdate("members", val)}
            searchQuery={filtersSearchQuery}
            memberIds={memberIds}
          />
        </div>

        {/* created date */}
        <div className="py-2">
          <FilterCreatedDate
            appliedFilters={filters.created_at ?? null}
            handleUpdate={(val) => handleFiltersUpdate("created_at", val)}
            searchQuery={filtersSearchQuery}
          />
        </div>
      </div>
    </div>
  );
});
