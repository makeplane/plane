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
import { Button } from "@plane/propel/button";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { Tooltip } from "@plane/propel/tooltip";
import { Switch } from "@plane/propel/switch";
import { useTranslation } from "@plane/i18n";
import { CloseIcon, SearchIcon } from "@plane/propel/icons";
import type { TWorkItemRelationsSearchRequestParams, TWorkItemRelationsSearchResponse } from "@plane/types";
import { Loader, EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { cn, getTabIndex } from "@plane/utils";
// components
import { IssueSearchModalEmptyState } from "@/components/core/modals/issue-search-modal-empty-state";
// helpers
import { usePlatformOS } from "@/hooks/use-platform-os";
// services
import { IssueService } from "@/services/issue";
// local imports
import { SubWorkItemsListItem } from "./list-item";
import { IssueIdentifier } from "../../issue-detail/issue-identifier";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  handleSubmit: (workItems: TWorkItemRelationsSearchResponse[]) => Promise<void>;
  projectId: string;
  typeId?: string;
  workItemId?: string;
  enableCrossProjectToggle?: boolean;
};

// services
const issueService = new IssueService();

export function SubWorkItemsListModal(props: Props) {
  const {
    isOpen,
    handleClose: onClose,
    handleSubmit,
    projectId,
    typeId,
    workItemId,
    enableCrossProjectToggle = true,
  } = props;
  // states
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [workItems, setWorkItems] = useState<TWorkItemRelationsSearchResponse[]>([]);
  const [selectedWorkItems, setSelectedWorkItems] = useState<TWorkItemRelationsSearchResponse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workspaceLevelSearch, setWorkspaceLevelSearch] = useState(false);
  // refs
  const searchTermRef = useRef(searchTerm);
  const workspaceLevelSearchRef = useRef(workspaceLevelSearch);
  // platform check
  const { isMobile } = usePlatformOS();
  // params
  const { workspaceSlug } = useParams();
  // translation
  const { t } = useTranslation();
  // fetch callback
  const fetchWorkItems = useCallback(async () => {
    if (!workspaceSlug) return;

    try {
      setIsSearching(true);
      setIsLoading(true);

      const params: TWorkItemRelationsSearchRequestParams = {
        search: searchTermRef.current,
        project_id: workspaceLevelSearchRef.current ? undefined : projectId,
        ...(workItemId !== undefined && { workitem_id: workItemId }),
        ...(typeId !== undefined && { type_id: typeId }),
      };
      const res = await issueService.subWorkItemsSearch(workspaceSlug, params);
      if (res && Array.isArray(res)) {
        setWorkItems(res);
      }
    } finally {
      setIsSearching(false);
      setIsLoading(false);
    }
  }, [workspaceSlug, projectId, typeId, workItemId]);
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
    workspaceLevelSearchRef.current = false;
    setWorkspaceLevelSearch(false);
  };

  const onSubmit = async () => {
    if (selectedWorkItems.length === 0) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("issue.select.error"),
      });

      return;
    }

    try {
      setIsSubmitting(true);
      await handleSubmit(selectedWorkItems);
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.TOP} width={EModalWidth.XXL}>
      <Combobox
        as="div"
        onChange={(val: TWorkItemRelationsSearchResponse) => {
          if (selectedWorkItems.some((i) => i.id === val.id))
            setSelectedWorkItems((prevData) => prevData.filter((i) => i.id !== val.id));
          else setSelectedWorkItems((prevData) => [...prevData, val]);
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
        <div className="flex flex-col-reverse px-4 gap-4 text-13 text-secondary sm:flex-row sm:items-center sm:justify-between">
          {selectedWorkItems.length > 0 ? (
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {selectedWorkItems.map((workItem) => (
                <div
                  key={workItem.id}
                  className="flex items-center gap-1 whitespace-nowrap rounded-md border border-subtle bg-layer-1 py-1 pl-2 text-11 text-primary"
                >
                  <IssueIdentifier
                    projectId={workItem.project.id}
                    issueTypeId={workItem.type_id}
                    projectIdentifier={workItem.project.identifier}
                    issueSequenceId={workItem.sequence_id}
                    size="xs"
                    variant="secondary"
                  />
                  <button
                    type="button"
                    className="group p-1"
                    onClick={() => setSelectedWorkItems((prevData) => prevData.filter((i) => i.id !== workItem.id))}
                  >
                    <CloseIcon className="h-3 w-3 text-secondary group-hover:text-primary" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="w-min whitespace-nowrap rounded-md border border-subtle bg-layer-1 p-2 text-11">
              {t("issue.select.empty")}
            </div>
          )}
          {enableCrossProjectToggle && (
            <Tooltip tooltipContent="Toggle workspace level search" isMobile={isMobile}>
              <div
                className={`flex shrink-0 cursor-pointer items-center gap-1 text-11 ${
                  workspaceLevelSearch ? "text-primary" : "text-secondary"
                }`}
              >
                <Switch
                  value={workspaceLevelSearch}
                  onChange={() => {
                    const next = !workspaceLevelSearchRef.current;
                    workspaceLevelSearchRef.current = next;
                    setWorkspaceLevelSearch(next);
                    fetchWorkItems();
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const next = !workspaceLevelSearchRef.current;
                    workspaceLevelSearchRef.current = next;
                    setWorkspaceLevelSearch(next);
                    fetchWorkItems();
                  }}
                  className="shrink-0"
                >
                  {t("common.workspace_level")}
                </button>
              </div>
            </Tooltip>
          )}
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
              {workspaceLevelSearch ? "in workspace:" : "in project:"}
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
                  {workItems.map((workItem) => {
                    const selected = selectedWorkItems.some((i) => i.id === workItem.id);

                    return (
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
                        <div className="flex items-center gap-2 truncate">
                          <input type="checkbox" checked={selected} readOnly />
                        </div>
                        <SubWorkItemsListItem workspaceSlug={workspaceSlug ?? ""} workItem={workItem} />
                      </Combobox.Option>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </Combobox.Options>
      </Combobox>
      <div className="flex items-center justify-end gap-2 border-t-[0.5px] border-subtle p-4">
        <Button variant="secondary" size="lg" onClick={handleClose}>
          {t("common.cancel")}
        </Button>
        <Button
          variant="primary"
          size="lg"
          onClick={onSubmit}
          loading={isSubmitting}
          disabled={selectedWorkItems.length === 0}
        >
          {isSubmitting ? t("common.adding") : t("issue.select.add_selected")}
        </Button>
      </div>
    </ModalCore>
  );
}
