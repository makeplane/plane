/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
import { usePopper } from "react-popper";
import { Combobox } from "@headlessui/react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { CheckIcon, ChevronDownIcon, SearchIcon } from "@plane/propel/icons";
import type { ISearchIssueResponse } from "@plane/types";
import { ComboDropDown } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";
import { useDropdown } from "@/hooks/use-dropdown";
import useDebounce from "@/hooks/use-debounce";
// services
import { ProjectService } from "@/services/project";

const projectService = new ProjectService();

/** a work item already known to the caller, so its label shows before any search */
export type TWorkItemSelectOption = { id: string; sequence_id: number; name: string; project_identifier: string };

type Props = {
  workspaceSlug: string;
  projectId: string | null;
  value: string | null;
  onChange: (issueId: string | null, option: TWorkItemSelectOption | null) => void;
  initialOption?: TWorkItemSelectOption | null;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  /** hide the "No work item (project time)" option */
  required?: boolean;
};

const NONE = "__none__";

/** A searchable work item picker within one project, with a "No work item (project time)" option. */
export const WorkItemSelect = observer(function WorkItemSelect(props: Props) {
  const {
    workspaceSlug,
    projectId,
    value,
    onChange,
    initialOption,
    disabled,
    className,
    buttonClassName,
    required = false,
  } = props;
  const { t } = useTranslation();
  // refs
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  // state
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TWorkItemSelectOption[] | null>(null);
  const [known, setKnown] = useState<Record<string, TWorkItemSelectOption>>({});
  const debouncedQuery = useDebounce(query, 300);
  // store hooks
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { getProjectIdentifierById } = useProject();

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "bottom-start",
    modifiers: [{ name: "preventOverflow", options: { padding: 12 } }],
  });

  const { handleClose, handleKeyDown, handleOnClick, searchInputKeyDown } = useDropdown({
    dropdownRef,
    inputRef,
    isOpen,
    query,
    setIsOpen,
    setQuery,
  });

  // search within the project while open
  useEffect(() => {
    if (!isOpen || !projectId) return;
    let cancelled = false;
    setResults(null);
    projectService
      .projectIssuesSearch(workspaceSlug, projectId, { search: debouncedQuery, workspace_search: false })
      .then((rows: ISearchIssueResponse[]) => {
        if (cancelled) return;
        const options = rows.map((row) => ({
          id: row.id,
          sequence_id: row.sequence_id,
          name: row.name,
          project_identifier: row.project__identifier,
        }));
        setResults(options);
        setKnown((current) => ({ ...current, ...Object.fromEntries(options.map((o) => [o.id, o])) }));
        return options;
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, projectId, workspaceSlug, debouncedQuery]);

  const selected = useMemo<TWorkItemSelectOption | null>(() => {
    if (!value) return null;
    if (known[value]) return known[value];
    if (initialOption?.id === value) return initialOption;
    const issue = getIssueById(value);
    if (issue)
      return {
        id: issue.id,
        sequence_id: issue.sequence_id,
        name: issue.name ?? "",
        project_identifier: getProjectIdentifierById(issue.project_id) ?? "",
      };
    return null;
  }, [value, known, initialOption, getIssueById, getProjectIdentifierById]);

  const handleChange = (next: string) => {
    if (next === NONE) onChange(null, null);
    else onChange(next, known[next] ?? null);
    handleClose();
  };

  const label = !projectId
    ? t("time-tracking.work_item.select_project_first")
    : selected
      ? `${selected.project_identifier}-${selected.sequence_id} ${selected.name}`
      : value
        ? "…"
        : t("time-tracking.work_item.none_option");

  const button = (
    <button
      ref={setReferenceElement}
      type="button"
      onClick={handleOnClick}
      disabled={disabled || !projectId}
      className={cn(
        "flex h-8 w-full items-center justify-between gap-2 rounded-md border-[0.5px] border-subtle-1 bg-layer-2 px-3 text-left text-13",
        { "cursor-not-allowed text-tertiary": disabled || !projectId, "text-primary": !!selected },
        buttonClassName
      )}
    >
      <span className={cn("truncate", { "text-placeholder": !selected })}>{label}</span>
      <ChevronDownIcon className="size-3 flex-shrink-0 text-tertiary" aria-hidden="true" />
    </button>
  );

  return (
    // oxlint-disable-next-line jsx_a11y/no-static-element-interactions
    <ComboDropDown
      as="div"
      ref={dropdownRef}
      className={cn("w-full", className)}
      value={value ?? NONE}
      onChange={handleChange}
      disabled={disabled || !projectId}
      onKeyDown={handleKeyDown}
      button={button}
    >
      {isOpen && (
        <Combobox.Options className="fixed z-30" static>
          <div
            className="my-1 w-80 rounded-sm border-[0.5px] border-strong bg-surface-1 px-2 py-2.5 text-13 shadow-raised-200 focus:outline-none"
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
          >
            <div className="flex items-center gap-1.5 rounded-sm border border-subtle bg-surface-2 px-2">
              <SearchIcon className="h-3.5 w-3.5 text-placeholder" strokeWidth={1.5} />
              <Combobox.Input
                as="input"
                ref={inputRef}
                className="w-full bg-transparent py-1 text-13 text-secondary placeholder:text-placeholder focus:outline-none"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("time-tracking.work_item.select_placeholder")}
                onKeyDown={searchInputKeyDown}
              />
            </div>
            <div className="mt-2 max-h-60 space-y-1 overflow-y-auto">
              {!required && (
                <Combobox.Option
                  value={NONE}
                  className={({ active }) =>
                    cn("flex cursor-pointer items-center justify-between rounded-sm px-1 py-1.5 text-secondary", {
                      "bg-layer-transparent-hover": active,
                    })
                  }
                >
                  {({ selected: isSelected }) => (
                    <>
                      <span className="truncate italic">{t("time-tracking.work_item.none_option")}</span>
                      {isSelected && <CheckIcon className="size-3.5 flex-shrink-0" />}
                    </>
                  )}
                </Combobox.Option>
              )}
              {results === null ? (
                <p className="px-1.5 py-1 text-placeholder italic">{t("loading")}</p>
              ) : results.length === 0 ? (
                <p className="px-1.5 py-1 text-placeholder italic">{t("no_matching_results")}</p>
              ) : (
                results.map((option) => (
                  <Combobox.Option
                    key={option.id}
                    value={option.id}
                    className={({ active }) =>
                      cn(
                        "flex cursor-pointer items-center justify-between gap-2 rounded-sm px-1 py-1.5 text-secondary",
                        {
                          "bg-layer-transparent-hover": active,
                        }
                      )
                    }
                  >
                    {({ selected: isSelected }) => (
                      <>
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="flex-shrink-0 text-11 text-tertiary">
                            {option.project_identifier}-{option.sequence_id}
                          </span>
                          <span className="truncate">{option.name}</span>
                        </span>
                        {isSelected && <CheckIcon className="size-3.5 flex-shrink-0" />}
                      </>
                    )}
                  </Combobox.Option>
                ))
              )}
            </div>
          </div>
        </Combobox.Options>
      )}
    </ComboDropDown>
  );
});
