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

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Combobox } from "@headlessui/react";
import { debounce } from "lodash-es";
import { useParams } from "react-router";
// plane imports
import { useTranslation } from "@plane/i18n";
import { SearchIcon } from "@plane/propel/icons";
import type { TWorkItemRelationsSearchRequestParams, TWorkItemRelationsSearchResponse } from "@plane/types";
import { Loader, EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { cn, getTabIndex } from "@plane/utils";
// components
import { IssueSearchModalEmptyState } from "@/components/core/modals/issue-search-modal-empty-state";
// helpers
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web imports
import { useWorkspaceFeatures } from "@/plane-web/hooks/store";
// types
import { EWorkspaceFeatures } from "@/types/workspace-feature";
// services
import { IssueService } from "@/services/issue";
// local imports
import { ParentIssuesListItem } from "./list-item";
// services
const issueService = new IssueService();

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  onChange: (workItem: TWorkItemRelationsSearchResponse) => void;
  projectId: string;
  typeId?: string;
  workItemId?: string;
};

export function ParentWorkItemsListModal(props: Props) {
  const { isOpen, handleClose: onClose, onChange, projectId, typeId, workItemId } = props;
  // states
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [workItems, setWorkItems] = useState<TWorkItemRelationsSearchResponse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  // refs
  const searchTermRef = useRef(searchTerm);
  const { isMobile } = usePlatformOS();
  // params
  const { workspaceSlug } = useParams();
  // translation
  const { t } = useTranslation();
  // store hooks
  const { isWorkspaceFeatureEnabled } = useWorkspaceFeatures();
  const isCrossProjectEnabled = isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_CROSS_PROJECT_SUB_WORK_ITEMS_ENABLED);
  // fetch callback
  const fetchWorkItems = useCallback(async () => {
    if (!workspaceSlug) return;

    try {
      setIsSearching(true);
      setIsLoading(true);

      const params: TWorkItemRelationsSearchRequestParams = {
        search: searchTermRef.current,
        project_id: isCrossProjectEnabled ? undefined : projectId,
        ...(workItemId !== undefined && { workitem_id: workItemId }),
        ...(typeId !== undefined && { type_id: typeId }),
      };
      const res = await issueService.parentWorkItemSearch(workspaceSlug, params);
      if (res && Array.isArray(res)) {
        setWorkItems(res);
      }
    } finally {
      setIsSearching(false);
      setIsLoading(false);
    }
  }, [isCrossProjectEnabled, projectId, workspaceSlug, typeId, workItemId]);
  // stable debounced callback — created once per fetchWorkItems identity
  const debouncedFetch = useMemo(() => debounce(fetchWorkItems, 500), [fetchWorkItems]);
  // cancel any pending debounced call when the function changes or component unmounts
  useEffect(() => () => debouncedFetch.cancel(), [debouncedFetch]);
  // fetch when modal first opens; skip when closed
  useEffect(() => {
    if (isOpen) fetchWorkItems();
  }, [isOpen, fetchWorkItems]);

  const { baseTabIndex } = getTabIndex(undefined, isMobile);

  const handleClose = () => {
    onClose();
    searchTermRef.current = "";
    setSearchTerm("");
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.TOP} width={EModalWidth.XXL}>
      <Combobox
        as="div"
        onChange={(val: TWorkItemRelationsSearchResponse) => {
          onChange(val);
          handleClose();
        }}
      >
        <div className="relative m-1">
          <SearchIcon
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 size-4 text-placeholder"
            aria-hidden="true"
          />
          <Combobox.Input
            className="h-12 w-full border-0 bg-transparent pl-10 pr-4 text-primary outline-none placeholder:text-placeholder focus:ring-0 sm:text-13"
            placeholder={t("common.search.placeholder")}
            value={searchTerm}
            onChange={(e) => {
              searchTermRef.current = e.target.value;
              setSearchTerm(e.target.value);
              debouncedFetch();
            }}
            displayValue={() => ""}
            tabIndex={baseTabIndex}
          />
        </div>
        <Combobox.Options
          static
          className="max-h-80 scroll-py-2 overflow-y-auto vertical-scrollbar scrollbar-md px-4 mb-4"
        >
          {searchTerm !== "" && (
            <h5 className="mt-2 text-caption-sm-regular text-secondary">
              Search results for{" "}
              <span className="text-primary">
                {'"'}
                {searchTerm}
                {'"'}
              </span>{" "}
              {isCrossProjectEnabled ? "in workspace:" : "in project:"}
            </h5>
          )}

          {isSearching || isLoading ? (
            <Loader className="space-y-3 mt-4">
              <Loader.Item height="40px" />
              <Loader.Item height="40px" />
              <Loader.Item height="40px" />
              <Loader.Item height="40px" />
            </Loader>
          ) : (
            <>
              {workItems.length === 0 ? (
                <IssueSearchModalEmptyState
                  resultCount={workItems.length}
                  isSearching={isSearching}
                  searchTerm={searchTerm}
                />
              ) : (
                <ul>
                  {workItems.map((workItem) => (
                    <Combobox.Option
                      key={workItem.id}
                      value={workItem}
                      className={({ active, selected }) =>
                        cn(
                          "group flex w-full cursor-pointer select-none items-center justify-between gap-2 rounded-md px-3 py-2 my-0.5 text-secondary",
                          {
                            "bg-layer-1 text-primary": active,
                            "text-primary": selected,
                          }
                        )
                      }
                    >
                      <ParentIssuesListItem workspaceSlug={workspaceSlug ?? ""} workItem={workItem} />
                    </Combobox.Option>
                  ))}
                </ul>
              )}
            </>
          )}
        </Combobox.Options>
      </Combobox>
    </ModalCore>
  );
}
