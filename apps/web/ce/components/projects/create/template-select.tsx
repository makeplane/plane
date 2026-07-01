/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo, useRef, useState } from "react";
import { Combobox } from "@headlessui/react";
import { ChevronDownIcon, ProjectIcon, SearchIcon } from "@plane/propel/icons";
import { ComboDropDown } from "@plane/ui";
import { WORKSPACE_PROJECT_TEMPLATES } from "@plane/constants";
import type { TProjectTemplate } from "@plane/types";
import { cn } from "@plane/utils";
import { usePopper } from "react-popper";
import useSWR from "swr";
// hooks
import { useDropdown } from "@/hooks/use-dropdown";
// services
import { ProjectService } from "@/services/project";

const projectService = new ProjectService();
const NO_TEMPLATE_VALUE = "__no_template__";

export type TProjectTemplateSelect = {
  disabled?: boolean;
  onChange: (template: TProjectTemplate | null) => void;
  selectedTemplate: TProjectTemplate | null;
  workspaceSlug: string;
};

export function ProjectTemplateSelect(props: TProjectTemplateSelect) {
  const { disabled = false, onChange, selectedTemplate, workspaceSlug } = props;
  // refs
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  // popper-js refs
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  // states
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  // popper-js init
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "bottom-start",
    modifiers: [
      {
        name: "preventOverflow",
        options: {
          padding: 16,
        },
      },
    ],
  });
  // data
  const {
    data: templates,
    error,
    isLoading,
    mutate,
  } = useSWR(
    workspaceSlug ? WORKSPACE_PROJECT_TEMPLATES(workspaceSlug) : null,
    () => projectService.getProjectTemplates(workspaceSlug),
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
    }
  );

  const filteredTemplates = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const templateList = templates ?? [];

    if (!normalizedQuery) return templateList;

    return templateList.filter((template) =>
      `${template.name} ${template.description ?? ""}`.toLowerCase().includes(normalizedQuery)
    );
  }, [query, templates]);

  const { handleClose, handleKeyDown, handleOnClick, searchInputKeyDown } = useDropdown({
    dropdownRef,
    inputRef,
    isOpen,
    query,
    setIsOpen,
    setQuery,
  });

  const handleChange = (value: string | null) => {
    if (value === NO_TEMPLATE_VALUE || !value) {
      onChange(null);
      handleClose();
      return;
    }

    const template = templates?.find((item) => item.id === value) ?? null;
    onChange(template);
    handleClose();
  };

  const label = selectedTemplate?.name ?? "Template";
  const selectedValue = selectedTemplate?.id ?? NO_TEMPLATE_VALUE;
  const buttonLabel = selectedTemplate
    ? `Selected project template: ${selectedTemplate.name}`
    : "Select project template";

  const button = (
    <button
      ref={setReferenceElement}
      type="button"
      aria-label={buttonLabel}
      aria-expanded={isOpen}
      className={cn(
        "shadow-sm border-on-color/20 bg-on-color/20 focus-visible:ring-on-color/40 inline-flex h-8 max-w-[140px] items-center gap-1 rounded-md border px-2 text-13 font-medium text-on-color backdrop-blur outline-none focus-visible:ring-2 sm:max-w-[160px]",
        {
          "cursor-not-allowed opacity-60": disabled,
          "hover:bg-on-color/30 cursor-pointer": !disabled,
        }
      )}
      onClick={handleOnClick}
      disabled={disabled}
    >
      <ProjectIcon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
      <span className="max-w-[92px] min-w-0 truncate sm:max-w-[112px]">{label}</span>
      <ChevronDownIcon className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
    </button>
  );

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <ComboDropDown
      as="div"
      ref={dropdownRef}
      className="h-full"
      value={selectedValue}
      onChange={handleChange}
      disabled={disabled}
      onKeyDown={handleKeyDown}
      button={button}
      multiple={false}
    >
      {isOpen && (
        <Combobox.Options className="fixed z-30" static>
          <div
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
            className="my-1 max-h-[min(384px,calc(100vh-96px))] w-[min(320px,calc(100vw-24px))] overflow-hidden rounded-md border border-subtle-1 bg-surface-1 p-2 shadow-raised-200 focus:outline-none sm:w-[280px]"
          >
            <div className="flex h-8 items-center gap-2 rounded-sm border border-subtle bg-surface-2 px-2">
              <SearchIcon className="h-4 w-4 flex-shrink-0 text-placeholder" strokeWidth={1.5} aria-hidden="true" />
              <Combobox.Input
                ref={inputRef}
                className="h-full w-full bg-transparent text-11 text-secondary placeholder:text-placeholder focus:outline-none"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={searchInputKeyDown}
                placeholder="Search templates"
              />
            </div>

            <div className="mt-2 max-h-[min(320px,calc(100vh-160px))] space-y-1 overflow-y-auto">
              <Combobox.Option
                value={NO_TEMPLATE_VALUE}
                className={({ active }) =>
                  cn("cursor-pointer rounded-md px-2 py-2 text-13 font-medium text-secondary select-none", {
                    "bg-layer-transparent-hover": active,
                  })
                }
              >
                <span className="block truncate font-medium">No template</span>
              </Combobox.Option>

              {isLoading && (
                <p className="px-2 py-2 text-11 text-placeholder" role="status">
                  Loading...
                </p>
              )}

              {!isLoading && error && (
                <div className="px-2 py-2 text-11 text-secondary" role="status">
                  <p>Could not load templates</p>
                  <button type="button" className="mt-2 text-accent-primary" onClick={() => void mutate()}>
                    Retry
                  </button>
                </div>
              )}

              {!isLoading &&
                !error &&
                filteredTemplates.map((template) => (
                  <Combobox.Option
                    key={template.id}
                    value={template.id}
                    className={({ active }) =>
                      cn("cursor-pointer rounded-md px-2 py-2 text-secondary select-none", {
                        "bg-layer-transparent-hover": active,
                      })
                    }
                  >
                    <span className="block truncate text-13 font-medium text-primary">{template.name}</span>
                    {template.description && (
                      <span className="mt-1 line-clamp-2 block text-11 leading-4 text-secondary">
                        {template.description}
                      </span>
                    )}
                  </Combobox.Option>
                ))}

              {!isLoading && !error && filteredTemplates.length === 0 && (
                <p className="px-2 py-2 text-11 text-placeholder" role="status">
                  No templates available
                </p>
              )}
            </div>
          </div>
        </Combobox.Options>
      )}
    </ComboDropDown>
  );
}
