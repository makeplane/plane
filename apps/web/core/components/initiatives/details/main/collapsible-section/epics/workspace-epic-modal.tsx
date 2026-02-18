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

import { useEffect, useMemo, useState } from "react";
import { isEqual } from "lodash-es";
import { observer } from "mobx-react";
import { Rocket, Search } from "lucide-react";
import { Combobox } from "@headlessui/react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { CloseIcon, EpicIcon } from "@plane/propel/icons";
// types
import type { ISearchIssueResponse, TWorkspaceEpicsSearchParams } from "@plane/types";
// ui
import { Checkbox, Loader, EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// helpers
import { generateWorkItemLink, getTabIndex } from "@plane/utils";
// hooks
import useDebounce from "@/hooks/use-debounce";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web components
import { getSelectedEpicDetails } from "@/components/initiatives/utils";
import { IssueIdentifier } from "@/components/issues/issue-detail/issue-identifier";
import { WorkspaceService } from "@/services/workspace.service";
// core imports
import { IdentifierText } from "@/components/issues/issue-detail/identifier-text";
// local imports
import { EpicSearchModalEmptyState } from "./issue-search-modal-empty-state";

type Props = {
  workspaceSlug: string | undefined;
  isOpen: boolean;
  handleClose: () => void;
  searchParams: Partial<TWorkspaceEpicsSearchParams>;
  handleOnSubmit: (data: ISearchIssueResponse[]) => Promise<void>;
  selectedEpicIds: string[];
};

// move this to workspace service
const workspaceService = new WorkspaceService();

export const WorkspaceEpicsListModal = observer(function WorkspaceEpicsListModal(props: Props) {
  const { workspaceSlug, isOpen, handleClose: onClose, handleOnSubmit, searchParams, selectedEpicIds } = props;
  // states
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [epics, setEpics] = useState<ISearchIssueResponse[]>([]);
  const [selectedEpics, setSelectedEpics] = useState<ISearchIssueResponse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // store hooks
  const { isMobile } = usePlatformOS();
  // hooks
  const debouncedSearchTerm: string = useDebounce(searchTerm, 500);
  const { baseTabIndex } = getTabIndex(undefined, isMobile);

  const { t } = useTranslation();

  // handlers
  const handleClose = () => {
    onClose();
    setSearchTerm("");
    setSelectedEpics([]);
  };

  const onSubmit = async () => {
    setIsSubmitting(true);

    await handleOnSubmit(selectedEpics).finally(() => setIsSubmitting(false));

    handleClose();
  };

  // fetch epics
  useEffect(() => {
    if (!isOpen || !workspaceSlug) return;
    setIsLoading(true);
    workspaceService
      .fetchWorkspaceEpics(workspaceSlug, {
        ...searchParams,
      })
      .then((res) => setEpics(res))
      .finally(() => {
        setIsSearching(false);
        setIsLoading(false);
      });
  }, [debouncedSearchTerm, isOpen, searchParams, workspaceSlug]);

  useEffect(() => {
    if (!isOpen || !workspaceSlug) return;
    const _selectedEpics = getSelectedEpicDetails(selectedEpicIds, workspaceSlug);
    setSelectedEpics(_selectedEpics);
  }, [isOpen, workspaceSlug, selectedEpicIds]);

  // filter by search term check for name and epic identifier (e.g. PROJECT-123)
  const filteredEpics = epics.filter((epic) => {
    const searchLower = debouncedSearchTerm.toLowerCase();
    const epicIdentifier = `${epic.project__identifier}-${epic.sequence_id}`.toLowerCase();
    return epic.name.toLowerCase().includes(searchLower) || epicIdentifier.includes(searchLower);
  });

  const showSubmitButton = useMemo(() => {
    const newEpicIds = selectedEpics.map((epic) => epic.id);
    return !isEqual(newEpicIds, selectedEpicIds);
  }, [selectedEpics, selectedEpicIds]);

  return (
    <>
      <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.TOP} width={EModalWidth.XXL}>
        <div className="relative mx-auto max-w-2xl">
          <Combobox
            as="div"
            onChange={(val: ISearchIssueResponse) => {
              if (selectedEpics.some((i) => i.id === val.id))
                setSelectedEpics((prevData) => prevData.filter((i) => i.id !== val.id));
              else setSelectedEpics((prevData) => [...prevData, val]);
            }}
          >
            <div className="relative m-1">
              <Search
                className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-primary text-opacity-40"
                aria-hidden="true"
              />
              <Combobox.Input
                className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-13 text-primary outline-none placeholder:text-placeholder focus:ring-0"
                placeholder={t("common.search.placeholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                tabIndex={baseTabIndex}
              />
            </div>

            <div className="flex flex-col-reverse gap-4 p-2 text-[0.825rem] text-secondary sm:flex-row sm:items-center sm:justify-between">
              {selectedEpics.length > 0 ? (
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {selectedEpics.map((epic) => (
                    <div
                      key={epic.id}
                      className="flex items-center gap-1 whitespace-nowrap rounded-md border border-subtle bg-layer-1-hover py-1 pl-2 text-11 text-primary"
                    >
                      <IssueIdentifier
                        projectId={epic.project_id}
                        issueTypeId={epic.type_id}
                        projectIdentifier={epic.project__identifier}
                        issueSequenceId={epic.sequence_id}
                        size="xs"
                        variant="secondary"
                      />
                      <button
                        type="button"
                        className="group p-1"
                        onClick={() => setSelectedEpics((prevData) => prevData.filter((i) => i.id !== epic.id))}
                      >
                        <CloseIcon className="h-3 w-3 text-secondary group-hover:text-primary" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-min whitespace-nowrap rounded-md border border-subtle bg-layer-1-hover p-2 text-11">
                  {t("epics.no_epics_selected")}
                </div>
              )}
            </div>

            <Combobox.Options static className="vertical-scrollbar scrollbar-md max-h-80 scroll-py-2 overflow-y-auto">
              {isSearching || isLoading ? (
                <Loader className="space-y-3 p-3">
                  <Loader.Item height="40px" />
                  <Loader.Item height="40px" />
                  <Loader.Item height="40px" />
                  <Loader.Item height="40px" />
                </Loader>
              ) : (
                <>
                  {filteredEpics.length === 0 ? (
                    <EpicSearchModalEmptyState
                      debouncedSearchTerm={debouncedSearchTerm}
                      isSearching={isSearching}
                      issues={filteredEpics}
                      searchTerm={searchTerm}
                    />
                  ) : (
                    <ul className={`text-13 text-primary ${filteredEpics.length > 0 ? "p-2" : ""}`}>
                      {filteredEpics.map((epic) => {
                        const selected = selectedEpics.some((i) => i.id === epic.id);

                        return (
                          <Combobox.Option
                            key={epic.id}
                            as="label"
                            htmlFor={`epic-${epic.id}`}
                            value={epic}
                            className={({ active }) =>
                              `group flex w-full cursor-pointer select-none items-center justify-between gap-2 rounded-md px-3 py-2 my-0.5 text-secondary ${
                                active ? "bg-layer-1-hover text-primary" : ""
                              } ${selected ? "text-primary" : ""}`
                            }
                          >
                            <div className="flex items-center gap-2 truncate">
                              <Checkbox checked={selected} readOnly />
                              <span
                                className="block h-1.5 w-1.5 flex-shrink-0 rounded-full"
                                style={{
                                  backgroundColor: epic.state__color,
                                }}
                              />
                              <div className="flex flex-shrink-0 items-center space-x-2">
                                <EpicIcon className="h-4 w-4 text-tertiary" />
                                <IdentifierText
                                  identifier={`${epic.project__identifier}-${epic.sequence_id}`}
                                  enableClickToCopyIdentifier
                                  size="xs"
                                  variant="secondary"
                                />
                              </div>
                              <span className="truncate">{epic.name}</span>
                            </div>
                            <a
                              href={generateWorkItemLink({
                                workspaceSlug,
                                projectId: epic?.project_id,
                                issueId: epic?.id,
                                projectIdentifier: epic?.project__identifier,
                                sequenceId: epic?.sequence_id,
                              })}
                              target="_blank"
                              className="z-1 relative hidden flex-shrink-0 text-secondary hover:text-primary group-hover:block"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Rocket className="h-4 w-4" />
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
          <div className="flex items-center justify-end gap-2 p-3">
            <Button variant="secondary" onClick={handleClose}>
              {t("cancel")}
            </Button>
            <Button
              variant="primary"
              onClick={onSubmit}
              loading={isSubmitting}
              disabled={!showSubmitButton || isSubmitting}
            >
              {isSubmitting ? t("adding") : t("submit")}
            </Button>
          </div>
        </div>
      </ModalCore>
    </>
  );
});
