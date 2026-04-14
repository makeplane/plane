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
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { SearchIcon, CloseIcon, NewTabIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { ReleaseSearchIssueResponse } from "@plane/types";
import { Loader, EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { generateWorkItemLink, getTabIndex } from "@plane/utils";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { IssueIdentifier } from "@/components/issues/issue-detail/issue-identifier";
import { IssueSearchModalEmptyState } from "@/components/core/modals/issue-search-modal-empty-state";
import releaseService from "@/services/release.service";
import type { ReleaseSearchWorkItemsParams } from "@/services/release.service";

type Props = {
  workspaceSlug: string | undefined;
  releaseId: string | undefined;
  isOpen: boolean;
  handleClose: () => void;
  searchParams?: Partial<ReleaseSearchWorkItemsParams>;
  handleOnSubmit: (data: ReleaseSearchIssueResponse[]) => Promise<void>;
  shouldHideIssue?: (issue: ReleaseSearchIssueResponse) => boolean;
};

export function ReleaseWorkItemsListModal(props: Props) {
  const { t } = useTranslation();
  const {
    workspaceSlug,
    releaseId,
    isOpen,
    handleClose: onClose,
    searchParams = {},
    handleOnSubmit,
    shouldHideIssue,
  } = props;

  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [issues, setIssues] = useState<ReleaseSearchIssueResponse[]>([]);
  const [selectedIssues, setSelectedIssues] = useState<ReleaseSearchIssueResponse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchTermRef = useRef(searchTerm);
  const { isMobile } = usePlatformOS();
  const { baseTabIndex } = getTabIndex(undefined, isMobile);

  const handleClose = () => {
    onClose();
    searchTermRef.current = "";
    setSearchTerm("");
    setSelectedIssues([]);
  };

  const onSubmit = async () => {
    if (selectedIssues.length === 0) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("issue.select.error"),
      });
      return;
    }
    setIsSubmitting(true);
    await handleOnSubmit(selectedIssues).finally(() => setIsSubmitting(false));
    handleClose();
  };

  const fetchWorkItems = useCallback(async () => {
    if (!workspaceSlug || !releaseId) return;
    setIsSearching(true);
    setIsLoading(true);
    releaseService
      .searchWorkItems(workspaceSlug, releaseId, {
        search: searchTermRef.current || undefined,
        ...searchParams,
      })
      .then((res) => setIssues(Array.isArray(res) ? res : []))
      .catch(() => setIssues([]))
      .finally(() => {
        setIsSearching(false);
        setIsLoading(false);
      });
  }, [workspaceSlug, releaseId, searchParams]);

  const debouncedFetch = useMemo(() => debounce(fetchWorkItems, 500), [fetchWorkItems]);

  useEffect(() => () => debouncedFetch.cancel(), [debouncedFetch]);

  useEffect(() => {
    if (isOpen) fetchWorkItems();
  }, [isOpen, fetchWorkItems]);

  const handleSelectIssues = () => {
    setSelectedIssues((prevData) => (prevData.length === filteredIssues.length ? [] : [...filteredIssues]));
  };

  const filteredIssues = issues.filter((issue) => !shouldHideIssue?.(issue));

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.XXL}>
      <Combobox
        as="div"
        onChange={(val: ReleaseSearchIssueResponse) => {
          if (selectedIssues.some((i) => i.id === val.id))
            setSelectedIssues((prevData) => prevData.filter((i) => i.id !== val.id));
          else setSelectedIssues((prevData) => [...prevData, val]);
        }}
      >
        <div className="relative m-1">
          <SearchIcon
            className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-primary text-opacity-40"
            aria-hidden="true"
          />
          <Combobox.Input
            className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-13 text-primary outline-none placeholder:text-placeholder focus:ring-0"
            placeholder={t("common.search.placeholder")}
            value={searchTerm}
            onChange={(e) => {
              searchTermRef.current = e.target.value;
              setSearchTerm(e.target.value);
              debouncedFetch();
            }}
            tabIndex={baseTabIndex}
          />
        </div>

        <div className="flex flex-col-reverse gap-4 p-2 text-13 text-secondary sm:flex-row sm:items-center sm:justify-between">
          {selectedIssues.length > 0 ? (
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {selectedIssues.map((issue) => {
                return (
                  <div
                    key={issue.id}
                    className="flex items-center gap-1 whitespace-nowrap rounded-md border border-subtle bg-layer-1 py-1 pl-2 text-11 text-primary"
                  >
                    <IssueIdentifier
                      projectId={issue.project?.id ?? ""}
                      issueTypeId={issue.type_id ?? ""}
                      projectIdentifier={issue.project?.identifier ?? ""}
                      issueSequenceId={issue.sequence_id}
                      size="xs"
                      variant="secondary"
                    />
                    <button
                      type="button"
                      className="group p-1"
                      onClick={() => setSelectedIssues((prevData) => prevData.filter((i) => i.id !== issue.id))}
                    >
                      <CloseIcon className="h-3 w-3 text-secondary group-hover:text-primary" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="w-min whitespace-nowrap rounded-md border border-subtle bg-layer-1 p-2 text-11">
              {t("issue.select.empty")}
            </div>
          )}
        </div>

        <Combobox.Options static className="vertical-scrollbar scrollbar-md max-h-80 scroll-py-2 overflow-y-auto">
          {searchTerm !== "" && (
            <h5 className="mx-2 text-13 text-secondary">
              {t("common.search.results_for", { query: searchTerm }) ?? `Search results for "${searchTerm}"`}
            </h5>
          )}

          {isSearching || isLoading ? (
            <Loader className="space-y-3 p-3">
              <Loader.Item height="40px" />
              <Loader.Item height="40px" />
              <Loader.Item height="40px" />
              <Loader.Item height="40px" />
            </Loader>
          ) : (
            <>
              {filteredIssues.length === 0 ? (
                <IssueSearchModalEmptyState
                  resultCount={filteredIssues.length}
                  isSearching={isSearching}
                  searchTerm={searchTerm}
                />
              ) : (
                <ul className={`text-13 text-primary ${filteredIssues.length > 0 ? "p-2" : ""}`}>
                  {filteredIssues.map((issue) => {
                    const selected = selectedIssues.some((i) => i.id === issue.id);

                    return (
                      <Combobox.Option
                        key={issue.id}
                        as="label"
                        htmlFor={`release-issue-${issue.id}`}
                        value={issue}
                        className={({ active }) =>
                          `group flex w-full cursor-pointer select-none items-center justify-between gap-2 rounded-md px-3 py-2 my-0.5 text-secondary ${
                            active ? "bg-layer-1 text-primary" : ""
                          } ${selected ? "text-primary" : ""}`
                        }
                      >
                        <div className="flex items-center gap-2 truncate shrink-0">
                          <input type="checkbox" checked={selected} readOnly />
                          <span
                            className="block h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{ backgroundColor: issue.state?.color ?? "" }}
                          />
                          <span className="shrink-0">
                            <IssueIdentifier
                              projectId={issue.project?.id ?? ""}
                              issueTypeId={issue.type_id ?? ""}
                              projectIdentifier={issue.project?.identifier ?? ""}
                              issueSequenceId={issue.sequence_id}
                              size="xs"
                              variant="secondary"
                            />
                          </span>
                          <span className="truncate">{issue.name}</span>
                        </div>
                        <a
                          href={generateWorkItemLink({
                            workspaceSlug,
                            projectId: issue.project?.id ?? "",
                            issueId: issue?.id,
                            projectIdentifier: issue.project?.identifier ?? "",
                            sequenceId: issue?.sequence_id,
                          })}
                          target="_blank"
                          className="z-1 relative hidden shrink-0 text-secondary hover:text-primary group-hover:block"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <NewTabIcon className="h-4 w-4" />
                        </a>
                      </Combobox.Option>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </Combobox.Options>
      </Combobox>
      <div className="flex justify-between items-center p-3">
        <Button
          variant="link"
          onClick={handleSelectIssues}
          disabled={filteredIssues.length === 0}
          className={filteredIssues.length === 0 ? "p-0" : ""}
        >
          {selectedIssues.length === filteredIssues.length && filteredIssues.length > 0
            ? t("issue.select.deselect_all")
            : t("issue.select.select_all")}
        </Button>
        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" size="lg" onClick={handleClose}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={onSubmit}
            loading={isSubmitting}
            disabled={isSubmitting || selectedIssues.length === 0}
          >
            {isSubmitting ? t("common.adding") : t("issue.select.add_selected")}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
}
