"use client";
import React, { useEffect, useMemo, useState } from "react";
import isEqual from "lodash/isEqual";
import { observer } from "mobx-react";
import { Rocket, Search, X } from "lucide-react";
import { Combobox, Dialog, Transition } from "@headlessui/react";
import { useTranslation } from "@plane/i18n";
// types
import { ISearchIssueResponse, TWorkspaceEpicsSearchParams } from "@plane/types";
// ui
import { Button, Checkbox, EpicIcon, Loader } from "@plane/ui";
// helpers
import { generateWorkItemLink, getTabIndex } from "@plane/utils";
// hooks
import useDebounce from "@/hooks/use-debounce";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web components
import { getSelectedEpicDetails } from "@/plane-web/components/initiatives/utils";
import { IdentifierText, IssueIdentifier } from "@/plane-web/components/issues";
import { WorkspaceService } from "@/plane-web/services";
import { EpicSearchModalEmptyState } from "./issue-search-modal-empty-state";

// services

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

export const WorkspaceEpicsListModal: React.FC<Props> = observer((props) => {
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

  // filter by search term check for name and sequence
  const filteredEpics = epics.filter((epic) => epic.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));

  const showSubmitButton = useMemo(() => {
    const newEpicIds = selectedEpics.map((epic) => epic.id);
    return !isEqual(newEpicIds, selectedEpicIds);
  }, [selectedEpics, selectedEpicIds]);

  return (
    <>
      <Transition.Root show={isOpen} as={React.Fragment} afterLeave={() => setSearchTerm("")} appear>
        <Dialog as="div" className="relative z-30" onClose={handleClose}>
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-custom-backdrop transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-30 overflow-y-auto p-4 sm:p-6 md:p-20">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="relative mx-auto max-w-2xl transform rounded-lg bg-custom-background-100 shadow-custom-shadow-md transition-all">
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
                      className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-custom-text-100 text-opacity-40"
                      aria-hidden="true"
                    />
                    <Combobox.Input
                      className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-sm text-custom-text-100 outline-none placeholder:text-custom-text-400 focus:ring-0"
                      placeholder={t("common.search.placeholder")}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      tabIndex={baseTabIndex}
                    />
                  </div>

                  <div className="flex flex-col-reverse gap-4 p-2 text-[0.825rem] text-custom-text-200 sm:flex-row sm:items-center sm:justify-between">
                    {selectedEpics.length > 0 ? (
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        {selectedEpics.map((epic) => (
                          <div
                            key={epic.id}
                            className="flex items-center gap-1 whitespace-nowrap rounded-md border border-custom-border-200 bg-custom-background-80 py-1 pl-2 text-xs text-custom-text-100"
                          >
                            <IssueIdentifier
                              projectId={epic.project_id}
                              issueTypeId={epic.type_id}
                              projectIdentifier={epic.project__identifier}
                              issueSequenceId={epic.sequence_id}
                              textContainerClassName="text-xs text-custom-text-200"
                            />
                            <button
                              type="button"
                              className="group p-1"
                              onClick={() => setSelectedEpics((prevData) => prevData.filter((i) => i.id !== epic.id))}
                            >
                              <X className="h-3 w-3 text-custom-text-200 group-hover:text-custom-text-100" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="w-min whitespace-nowrap rounded-md border border-custom-border-200 bg-custom-background-80 p-2 text-xs">
                        {t("epics.no_epics_selected")}
                      </div>
                    )}
                  </div>

                  <Combobox.Options
                    static
                    className="vertical-scrollbar scrollbar-md max-h-80 scroll-py-2 overflow-y-auto"
                  >
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
                          <ul className={`text-sm text-custom-text-100 ${filteredEpics.length > 0 ? "p-2" : ""}`}>
                            {filteredEpics.map((epic) => {
                              const selected = selectedEpics.some((i) => i.id === epic.id);

                              return (
                                <Combobox.Option
                                  key={epic.id}
                                  as="label"
                                  htmlFor={`epic-${epic.id}`}
                                  value={epic}
                                  className={({ active }) =>
                                    `group flex w-full cursor-pointer select-none items-center justify-between gap-2 rounded-md px-3 py-2 my-0.5 text-custom-text-200 ${
                                      active ? "bg-custom-background-80 text-custom-text-100" : ""
                                    } ${selected ? "text-custom-text-100" : ""}`
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
                                      <EpicIcon className="h-4 w-4 text-custom-text-300" />
                                      <IdentifierText
                                        identifier={`${epic.project__identifier}-${epic.sequence_id}`}
                                        enableClickToCopyIdentifier
                                        textContainerClassName="text-xs text-custom-text-200"
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
                                    className="z-1 relative hidden flex-shrink-0 text-custom-text-200 hover:text-custom-text-100 group-hover:block"
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
                  <Button variant="neutral-primary" size="sm" onClick={handleClose}>
                    {t("cancel")}
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={onSubmit}
                    loading={isSubmitting}
                    disabled={!showSubmitButton || isSubmitting}
                  >
                    {isSubmitting ? t("adding") : t("submit")}
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
});
