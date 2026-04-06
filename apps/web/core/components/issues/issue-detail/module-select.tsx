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

import { Fragment, useRef, useState, useEffect } from "react";
import type { KeyboardEvent } from "react";
import { observer } from "mobx-react";
import { usePopper } from "react-popper";
import { Combobox } from "@headlessui/react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { CheckIcon, CloseIcon, ModuleIcon, PlusIcon, SearchIcon } from "@plane/propel/icons";
import { cn, sortBySelectedFirst } from "@plane/utils";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useModule } from "@/hooks/store/use-module";
import { usePlatformOS } from "@/hooks/use-platform-os";
// types
import type { TIssueOperations } from "./root";

type TIssueModuleSelect = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  issueOperations: TIssueOperations;
  disabled?: boolean;
};

export const IssueModuleSelect = observer(function IssueModuleSelect(props: TIssueModuleSelect) {
  const { workspaceSlug, projectId, issueId, issueOperations, disabled = false } = props;
  // states
  const [isUpdating, setIsUpdating] = useState(false);
  // refs — serialize operations so a second call waits for the first to finish
  const pendingOp = useRef<Promise<void>>(Promise.resolve());
  // store hooks
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { getModuleById } = useModule();
  // derived values
  const issue = getIssueById(issueId);
  const moduleIds = issue?.module_ids ?? [];
  const disableSelect = disabled || isUpdating;

  const enqueue = (fn: () => Promise<void>) => {
    setIsUpdating(true);
    pendingOp.current = pendingOp.current.then(fn).finally(() => setIsUpdating(false));
  };

  const handleRemoveModule = (moduleId: string) => {
    enqueue(
      () =>
        issueOperations.changeModulesInIssue?.(workspaceSlug, projectId, issueId, [], [moduleId]) ?? Promise.resolve()
    );
  };

  const handleModuleToggle = (newModuleIds: string[]) => {
    enqueue(async () => {
      const current = getIssueById(issueId)?.module_ids ?? [];
      const modulesToAdd = newModuleIds.filter((id) => !current.includes(id));
      const modulesToRemove = current.filter((id) => !newModuleIds.includes(id));
      if (modulesToAdd.length === 0 && modulesToRemove.length === 0) return;
      await issueOperations.changeModulesInIssue?.(workspaceSlug, projectId, issueId, modulesToAdd, modulesToRemove);
    });
  };

  return (
    <div className="relative flex flex-wrap items-center gap-2 min-h-7.5 w-full px-2 truncate">
      {moduleIds.map((moduleId) => {
        const moduleDetail = getModuleById(moduleId);
        if (!moduleDetail) return null;
        return (
          <Button
            key={moduleId}
            variant="tertiary"
            size="sm"
            onClick={() => handleRemoveModule(moduleId)}
            disabled={disableSelect}
            className="truncate"
          >
            <ModuleIcon className="size-3 shrink-0" />
            <span className="text-body-xs-regular truncate">{moduleDetail.name}</span>
            {!disableSelect && (
              <CloseIcon className="transition-all h-2.5 w-2.5 group-hover:text-danger-primary shrink-0" />
            )}
          </Button>
        );
      })}

      {!disableSelect && (
        <IssueModuleSelectDropdown
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          currentModuleIds={moduleIds}
          onToggle={handleModuleToggle}
        />
      )}
    </div>
  );
});

// ---------------------------------------------------------------------------
// Dropdown: "+" button that opens a searchable module multi-select combobox
// (mirrors IssueLabelSelect from label/select/label-select.tsx)
// ---------------------------------------------------------------------------

type IssueModuleSelectDropdownProps = {
  workspaceSlug: string;
  projectId: string;
  currentModuleIds: string[];
  onToggle: (moduleIds: string[]) => void;
};

const IssueModuleSelectDropdown = observer(function IssueModuleSelectDropdown(props: IssueModuleSelectDropdownProps) {
  const { workspaceSlug, projectId, currentModuleIds, onToggle } = props;
  const { t } = useTranslation();
  // store hooks
  const { getModuleById, getProjectModuleIds, fetchModules } = useModule();
  const { isMobile } = usePlatformOS();
  // states
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const [query, setQuery] = useState("");
  // refs
  const inputRef = useRef<HTMLInputElement | null>(null);

  const projectModuleIds = getProjectModuleIds(projectId);

  const handleOpen = () => {
    if (!projectModuleIds && workspaceSlug && projectId) {
      fetchModules(workspaceSlug, projectId);
    }
  };

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "left-end",
    modifiers: [{ name: "preventOverflow", options: { padding: 12 } }],
  });

  const options = (projectModuleIds ?? []).map((moduleId) => {
    const moduleDetail = getModuleById(moduleId);
    return {
      value: moduleId,
      query: moduleDetail?.name ?? "",
      content: (
        <div className="flex items-center gap-2">
          <ModuleIcon className="h-3 w-3 shrink-0" />
          <span className="grow truncate">{moduleDetail?.name}</span>
        </div>
      ),
    };
  });

  const filteredOptions =
    sortBySelectedFirst(
      query === "" ? options : options.filter((o) => o.query.toLowerCase().includes(query.toLowerCase())),
      currentModuleIds
    ) ?? [];

  const searchInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (query !== "" && e.key === "Escape") {
      e.stopPropagation();
      setQuery("");
    }
  };

  return (
    <Combobox
      as="div"
      className="size-full shrink-0 text-left"
      value={currentModuleIds}
      onChange={(value) => onToggle(value)}
      multiple
    >
      {({ open }) => (
        <ModuleDropdownContent
          open={open}
          isMobile={isMobile}
          inputRef={inputRef}
          referenceElement={setReferenceElement}
          popperElement={setPopperElement}
          styles={styles}
          attributes={attributes}
          query={query}
          setQuery={setQuery}
          filteredOptions={filteredOptions}
          projectModuleIds={projectModuleIds}
          handleOpen={handleOpen}
          searchInputKeyDown={searchInputKeyDown}
          t={t}
        />
      )}
    </Combobox>
  );
});

// Extracted to satisfy Rules of Hooks — useEffect must be at component top level
type ModuleDropdownContentProps = {
  open: boolean;
  isMobile: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  referenceElement: (el: HTMLButtonElement | null) => void;
  popperElement: (el: HTMLDivElement | null) => void;
  styles: ReturnType<typeof usePopper>["styles"];
  attributes: ReturnType<typeof usePopper>["attributes"];
  query: string;
  setQuery: (q: string) => void;
  filteredOptions: { value: string; query: string; content: React.ReactNode }[];
  projectModuleIds: string[] | null;
  handleOpen: () => void;
  searchInputKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  t: (key: string) => string;
};

function ModuleDropdownContent(props: ModuleDropdownContentProps) {
  const {
    open,
    isMobile,
    inputRef,
    referenceElement,
    popperElement,
    styles,
    attributes,
    query,
    setQuery,
    filteredOptions,
    projectModuleIds,
    handleOpen,
    searchInputKeyDown,
    t,
  } = props;

  useEffect(() => {
    if (open && !isMobile) inputRef.current?.focus();
  }, [open, isMobile, inputRef]);

  return (
    <>
      <Combobox.Button as={Fragment}>
        <Button
          ref={referenceElement}
          type="button"
          variant="tertiary"
          size="sm"
          prependIcon={<PlusIcon />}
          onClick={handleOpen}
        >
          <span className="text-body-xs-medium text-placeholder">{t("module.select")}</span>
        </Button>
      </Combobox.Button>

      {open && (
        <Combobox.Options className="fixed z-10" static>
          <div
            className="my-1 w-48 rounded-sm border-[0.5px] border-strong bg-surface-1 px-2 py-2.5 text-11 shadow-raised-200 focus:outline-none"
            ref={popperElement}
            style={styles.popper}
            {...attributes.popper}
          >
            <div className="flex items-center gap-1.5 rounded-sm border border-subtle bg-surface-2 px-2">
              <SearchIcon className="h-3.5 w-3.5 text-placeholder" strokeWidth={1.5} />
              <Combobox.Input
                as="input"
                ref={inputRef as React.RefObject<HTMLInputElement>}
                className="w-full bg-transparent py-1 text-11 text-secondary placeholder:text-placeholder focus:outline-none"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("common.search.label")}
                displayValue={(assigned: unknown) => (assigned as { name?: string })?.name ?? ""}
                onKeyDown={searchInputKeyDown}
              />
            </div>
            <div className="mt-2 max-h-48 space-y-1 overflow-y-scroll">
              {projectModuleIds ? (
                filteredOptions.length > 0 ? (
                  filteredOptions.map((option) => (
                    <Combobox.Option
                      key={option.value}
                      value={option.value}
                      className={({ active, selected }) =>
                        cn(
                          "flex w-full cursor-pointer select-none items-center justify-between gap-2 truncate rounded-sm px-1 py-1.5",
                          {
                            "bg-layer-transparent-hover": active,
                            "text-primary": selected,
                            "text-secondary": !selected,
                          }
                        )
                      }
                    >
                      {({ selected }) => (
                        <>
                          <span className="grow truncate">{option.content}</span>
                          {selected && <CheckIcon className="h-3.5 w-3.5 shrink-0" />}
                        </>
                      )}
                    </Combobox.Option>
                  ))
                ) : (
                  <p className="px-1.5 py-1 italic text-placeholder">{t("common.search.no_matching_results")}</p>
                )
              ) : (
                <p className="px-1.5 py-1 italic text-placeholder">{t("common.loading")}</p>
              )}
            </div>
          </div>
        </Combobox.Options>
      )}
    </>
  );
}
