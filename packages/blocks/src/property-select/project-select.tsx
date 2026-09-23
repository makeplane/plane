/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
import { Logo } from "../emoji-icon-picker";
import { ChevronDownOutline, ProjectsOutline } from "@makeplane/propel/icons";
import { cn } from "@plane/utils";
import type { TLogoProps, TPaginatedResponse } from "@plane/types";
import { Select, splitSelectVariant } from "../select";
import type { SelectPaginationParams, SelectTooltip, SelectVariant } from "../select";

/** Minimal project shape the dropdown needs — the client maps its richer record down to this. */
export type ProjectOption = {
  id: string;
  name: string;
  identifier?: string;
  logo_props?: TLogoProps;
};

type ProjectSelectBaseProps = {
  getValues: (params: SelectPaginationParams) => Promise<TPaginatedResponse<ProjectOption[]>>;
  disabled?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  onClose?: () => void;
  className?: string;
  tooltip?: SelectTooltip;
  /** Optional context rendered below the selected project's name in the trigger. */
  selectedDescription?: ReactNode;
  /** Tab order of the trigger, for forms that sequence focus explicitly (e.g. the work item create modal). */
  tabIndex?: number;
};

export type ProjectSelectProps =
  | (ProjectSelectBaseProps & {
      /** Multi-select: emits all selected ids on change. `variant` cannot be `"breadcrumb"`. */
      multiple: true;
      value: ProjectOption[];
      onChange: (ids: string[]) => void;
      variant: Exclude<SelectVariant, "breadcrumb">;
    })
  | (ProjectSelectBaseProps & {
      /** Single-select (default). Supports all variants including `"breadcrumb"`. */
      multiple?: false;
      value: ProjectOption | null;
      onChange: (id: string) => void;
      variant: SelectVariant;
    });

function ProjectLogo({
  logoProps,
  className,
  /**
   * `glyph` is propel's 16px option slot with a 16px glyph. `stack` keeps the trigger stack's 16px
   * slot around a 14px glyph (matches legacy ProjectDropdown) so stacked logos don't sit flush.
   * `chip` is the tighter slot a trigger pill uses.
   */
  density = "glyph",
}: {
  logoProps?: TLogoProps;
  className?: string;
  density?: "glyph" | "stack" | "chip";
}) {
  const slotClassName = density === "chip" ? "size-3.5" : "size-4";
  const iconSize = density === "glyph" ? 16 : 14;
  if (logoProps?.in_use) {
    return (
      <span className={cn("grid shrink-0 place-items-center", slotClassName, className)}>
        <Logo logo={logoProps} size={iconSize} />
      </span>
    );
  }
  return <ProjectsOutline className={cn("shrink-0 text-primary", slotClassName, className)} />;
}

function triggerLabel(selected: ProjectOption[], showCountOnMultiple: boolean, placeholder?: string): string {
  if (selected.length === 0) return placeholder ?? "";
  if (selected.length === 1) return selected[0]?.name ?? "";
  if (showCountOnMultiple) return `${selected.length} projects`;
  return selected.map((project) => project.name).join(", ");
}

/**
 * Render logos inside trigger *children*, not `prependIcon`.
 * `PillButtonContent` cloneElement-overwrites prepend className → kills flex → logos stack vertical.
 */
function TriggerLogos({ selected }: { selected: ProjectOption[] }) {
  if (selected.length === 0) return <ProjectsOutline className="size-3.5 shrink-0" />;
  return (
    <span className="flex shrink-0 items-center gap-1">
      {selected.slice(0, 3).map((project) => (
        <ProjectLogo key={project.id} logoProps={project.logo_props} density="stack" />
      ))}
    </span>
  );
}

/**
 * Presentational, data-source-agnostic project picker.
 * Pass `multiple={true}` for multi-select; omit or pass `multiple={false}` for single-select.
 */
export function ProjectSelect(props: ProjectSelectProps) {
  const { variant } = props;
  const splitVariant = splitSelectVariant(variant);
  const isSelect = splitVariant.variant === "select";
  const showCountOnMultiple = !isSelect;
  // `h-auto` lets a multi-select grow as chips wrap; the floor is the variant's own size step
  // (`min-h-(--control-height-*)`), so the trigger lines up with the field boxes beside it.
  const selectClassName = isSelect ? "h-auto" : undefined;

  if (!props.multiple) {
    const {
      getValues,
      value,
      onChange,
      disabled = false,
      placeholder = "",
      searchPlaceholder = "Search projects...",
      onClose,
      className,
      tooltip,
      selectedDescription,
      tabIndex,
    } = props;

    return (
      <Select<ProjectOption>
        infinite
        getValues={getValues}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        searchPlaceholder={searchPlaceholder}
        onClose={onClose}
        getOptionValue={(project) => project.id}
        getOptionLabel={(project) => project.name}
        getOptionIcon={(project) => <ProjectLogo logoProps={project.logo_props} />}
      >
        <Select.Trigger<ProjectOption>
          disabled={disabled}
          variant={variant}
          tabIndex={tabIndex}
          className={cn(selectClassName, selectedDescription && "h-auto gap-2 rounded-lg px-2 py-1", className)}
          appendIcon={selectedDescription ? null : undefined}
          label={(projects) => projects[0]?.name ?? placeholder}
          tooltip={tooltip}
        >
          {(projects) => {
            const selected = projects[0];
            const label = selected?.name ?? placeholder;
            return (
              <>
                {selectedDescription ? (
                  <span className="grid size-8 shrink-0 place-items-center rounded-md bg-layer-1">
                    {selected?.logo_props?.in_use ? (
                      <Logo logo={selected.logo_props} size={20} />
                    ) : (
                      <ProjectsOutline className="size-5" />
                    )}
                  </span>
                ) : (
                  <TriggerLogos selected={projects} />
                )}
                {(!!selected || !!placeholder) &&
                  (selectedDescription ? (
                    <span className="flex min-w-0 grow flex-col items-start text-left">
                      <span className="w-full truncate text-body-sm-medium text-primary">{label}</span>
                      <span className="w-full truncate text-caption-md-regular text-tertiary">
                        {selectedDescription}
                      </span>
                    </span>
                  ) : (
                    <span className="min-w-0 grow truncate text-left">{label}</span>
                  ))}
                {/* `select` and `select-ghost` chrome get their chevron from SelectContent's own default; pill/table-cell/breadcrumb need it here. */}
                {selectedDescription ? (
                  <ChevronDownOutline className="size-4 shrink-0 text-tertiary" aria-hidden="true" />
                ) : !splitVariant.isSelectKind ? (
                  <ChevronDownOutline className="size-2.5 shrink-0 text-placeholder" aria-hidden="true" />
                ) : null}
              </>
            );
          }}
        </Select.Trigger>
      </Select>
    );
  }

  const {
    getValues,
    value,
    onChange,
    disabled = false,
    placeholder = "",
    searchPlaceholder = "Search projects...",
    onClose,
    className,
    tooltip,
    tabIndex,
  } = props;

  return (
    <Select<ProjectOption>
      infinite
      multiple
      getValues={getValues}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      onClose={onClose}
      getOptionValue={(project) => project.id}
      getOptionLabel={(project) => project.name}
      getOptionIcon={(project) => <ProjectLogo logoProps={project.logo_props} />}
    >
      <Select.Trigger<ProjectOption>
        disabled={disabled}
        variant={variant}
        tabIndex={tabIndex}
        className={cn(selectClassName, className)}
        tooltip={tooltip}
      >
        {(projects) => {
          const showPills = isSelect && projects.length > 0;
          return (
            <>
              {showPills ? (
                <div className="flex min-w-0 grow flex-wrap items-center gap-1">
                  {projects.map((project) => (
                    <span
                      key={project.id}
                      className="flex h-5 max-w-full items-center gap-1 rounded-sm bg-layer-3 px-1.5 text-caption-md-medium text-secondary"
                    >
                      <ProjectLogo logoProps={project.logo_props} density="chip" />
                      <span className="truncate">{project.name}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <>
                  {/* `select` empty state is text-only (pills cover the non-empty case). */}
                  {!isSelect && <TriggerLogos selected={projects} />}
                  {(projects.length > 0 || !!placeholder) && (
                    <span className="min-w-0 grow truncate text-left">
                      {triggerLabel(projects, showCountOnMultiple, placeholder)}
                    </span>
                  )}
                </>
              )}
            </>
          );
        }}
      </Select.Trigger>
    </Select>
  );
}
