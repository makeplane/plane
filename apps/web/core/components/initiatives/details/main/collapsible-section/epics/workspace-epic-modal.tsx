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

import { useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useForm } from "react-hook-form";
import { Search } from "lucide-react";
import { Combobox } from "@headlessui/react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
// types
import type { ISearchIssueResponse, TWorkspaceEpicsSearchParams } from "@plane/types";
// ui
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// helpers
import { getTabIndex } from "@plane/utils";
// hooks
import useDebounce from "@/hooks/use-debounce";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { usePlatformOS } from "@/hooks/use-platform-os";
// local imports
import { EpicRowSkeleton } from "./epic-row-skeleton";
import { EpicSearchModalEmptyState } from "./issue-search-modal-empty-state";
import { SelectedEpicChip } from "./selected-epic-chip";
import { WorkspaceEpicOption } from "./workspace-epic-option";
import { useWorkspaceEpicsInfinite } from "@/hooks/use-workspace-epics-infinite";
import { getSelectedEpicDetails } from "@/components/initiatives/utils";

type FormValues = {
  selectedEpics: ISearchIssueResponse[];
};

type Props = {
  workspaceSlug: string | undefined;
  isOpen: boolean;
  handleClose: () => void;
  searchParams: Partial<TWorkspaceEpicsSearchParams>;
  handleOnSubmit: (data: ISearchIssueResponse[]) => Promise<void>;
  selectedEpicIds: string[];
};

export const WorkspaceEpicsListModal = observer(function WorkspaceEpicsListModal(props: Props) {
  const { workspaceSlug, isOpen, handleClose: onClose, handleOnSubmit, searchParams, selectedEpicIds } = props;

  // states
  const [searchTerm, setSearchTerm] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [sentinelEl, setSentinelEl] = useState<HTMLDivElement | null>(null);
  const epicDetails = workspaceSlug ? getSelectedEpicDetails(selectedEpicIds, workspaceSlug) : [];
  // react-hook-form
  const {
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting, isDirty },
  } = useForm<FormValues>({ defaultValues: { selectedEpics: epicDetails } });

  const selectedEpics = watch("selectedEpics");

  const { isMobile } = usePlatformOS();
  // hooks
  const debouncedSearchTerm: string = useDebounce(searchTerm, 500);
  const { baseTabIndex } = getTabIndex(undefined, isMobile);

  const { t } = useTranslation();

  const apiParams = useMemo<Partial<TWorkspaceEpicsSearchParams>>(
    () => ({
      initiative_id: searchParams.initiative_id,
      cursor: searchParams.cursor,
      page_size: searchParams.page_size,
      search: debouncedSearchTerm.trim() || undefined,
    }),
    [searchParams.initiative_id, searchParams.cursor, searchParams.page_size, debouncedSearchTerm]
  );

  const { epics, hasMore, loadMore, isLoading, isValidating } = useWorkspaceEpicsInfinite({
    workspaceSlug,
    isOpen,
    apiParams,
  });

  useIntersectionObserver(scrollContainerRef, hasMore && !debouncedSearchTerm ? sentinelEl : null, loadMore, "100px");

  const handleClose = () => {
    onClose();
  };

  const onSubmit = handleSubmit(async ({ selectedEpics: epicsToSubmit }) => {
    await handleOnSubmit(epicsToSubmit);
    handleClose();
  });

  const filteredEpics = useMemo(() => {
    const term = debouncedSearchTerm.trim().toLowerCase();
    if (!term) return epics;
    return epics.filter((epic) => {
      const epicIdentifier = `${epic.project__identifier}-${epic.sequence_id}`.toLowerCase();
      return epic.name.toLowerCase().includes(term) || epicIdentifier.includes(term);
    });
  }, [epics, debouncedSearchTerm]);

  return (
    <>
      <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.TOP} width={EModalWidth.XXL}>
        <div className="relative mx-auto max-w-4xl">
          <Combobox
            as="div"
            onChange={(val: ISearchIssueResponse) => {
              const current = selectedEpics;
              const next = current.some((i) => i.id === val.id)
                ? current.filter((i) => i.id !== val.id)
                : [...current, val];
              setValue("selectedEpics", next, { shouldDirty: true });
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
                    <SelectedEpicChip
                      key={epic.id}
                      epic={epic}
                      onRemove={() => {
                        setValue(
                          "selectedEpics",
                          selectedEpics.filter((i) => i.id !== epic.id),
                          { shouldDirty: true }
                        );
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="w-min whitespace-nowrap rounded-md border border-subtle bg-layer-1-hover p-2 text-11">
                  {t("epics.no_epics_selected")}
                </div>
              )}
            </div>

            <Combobox.Options static className="scroll-py-2">
              {isLoading ? (
                <div className="p-2 space-y-0.5" aria-label={t("common.loading")}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <EpicRowSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <>
                  {filteredEpics.length === 0 ? (
                    <EpicSearchModalEmptyState
                      debouncedSearchTerm={debouncedSearchTerm}
                      isSearching={false}
                      issues={filteredEpics}
                      searchTerm={searchTerm}
                    />
                  ) : (
                    <div
                      ref={scrollContainerRef}
                      className="vertical-scrollbar scrollbar-md max-h-80 overflow-y-auto p-2"
                    >
                      <ul className="text-13 text-primary">
                        {filteredEpics.map((epic) => (
                          <WorkspaceEpicOption
                            key={epic.id}
                            epic={epic}
                            workspaceSlug={workspaceSlug}
                            selected={selectedEpics.some((i) => i.id === epic.id)}
                          />
                        ))}
                      </ul>
                      {hasMore && !debouncedSearchTerm && (
                        <div ref={setSentinelEl} className="pt-1 pb-2">
                          {isValidating ? (
                            <div className="space-y-0.5">
                              {Array.from({ length: 2 }).map((_, i) => (
                                <EpicRowSkeleton key={i} />
                              ))}
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </Combobox.Options>
          </Combobox>
          <div className="flex items-center justify-end gap-2 p-3">
            <Button variant="secondary" onClick={handleClose}>
              {t("cancel")}
            </Button>
            <Button variant="primary" onClick={onSubmit} loading={isSubmitting} disabled={!isDirty || isSubmitting}>
              {isSubmitting ? t("adding") : t("submit")}
            </Button>
          </div>
        </div>
      </ModalCore>
    </>
  );
});
