/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useRef, useState } from "react";
import { FastForward } from "lucide-react";
import { observer } from "mobx-react";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { ChevronDownIcon } from "@plane/propel/icons";
import type { TLogoProps } from "@plane/types";
import { ComboDropDown } from "@plane/ui";
import { cn } from "@plane/utils";
import { useWorkspaceSprint } from "@/hooks/store/use-workspace-sprint";
import { useDropdown } from "@/hooks/use-dropdown";
import { WorkspaceSprintOptions } from "./sprint-options";

type Props = {
  value: string | null;
  onChange: (sprintId: string | null) => void;
  disabled?: boolean;
  className?: string;
  fallbackName?: string | null;
};

export const WorkspaceSprintDropdown = observer(function WorkspaceSprintDropdown(props: Props) {
  const { value, onChange, disabled = false, className, fallbackName } = props;
  const [isOpen, setIsOpen] = useState(false);
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const { getSprintAutomationById, getSprintById } = useWorkspaceSprint();
  const selectedSprint = value ? getSprintById(value) : null;
  const selectedAutomation = getSprintAutomationById(selectedSprint?.automation_id);
  const selectedName = selectedSprint?.name ?? fallbackName ?? null;
  const { handleClose, handleKeyDown, handleOnClick } = useDropdown({
    dropdownRef,
    isOpen,
    setIsOpen,
  });

  const dropdownOnChange = (sprintId: string | null) => {
    onChange(sprintId);
    handleClose();
  };

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <ComboDropDown
      as="div"
      ref={dropdownRef}
      className={cn("h-full", className)}
      value={value ?? ""}
      onChange={dropdownOnChange}
      disabled={disabled}
      onKeyDown={handleKeyDown}
      button={
        <button
          ref={setReferenceElement}
          type="button"
          className={cn(
            "border-custom-border-200 bg-custom-background-100 text-custom-text-300 hover:bg-custom-background-80 flex h-5 max-w-44 cursor-pointer items-center gap-1 rounded border px-1.5 text-caption-sm-regular outline-hidden disabled:cursor-not-allowed disabled:opacity-60",
            className
          )}
          onClick={handleOnClick}
          disabled={disabled}
          title={selectedName ?? "No sprint"}
        >
          <WorkspaceSprintDropdownIcon logoProps={selectedAutomation?.logo_props} />
          <span className="truncate">{selectedName ?? "No sprint"}</span>
          <ChevronDownIcon className="h-2.5 w-2.5 flex-shrink-0" aria-hidden="true" />
        </button>
      }
    >
      {isOpen && <WorkspaceSprintOptions isOpen={isOpen} referenceElement={referenceElement} />}
    </ComboDropDown>
  );
});

function WorkspaceSprintDropdownIcon({ logoProps }: { logoProps: TLogoProps | undefined }) {
  return logoProps?.in_use ? (
    <Logo logo={logoProps} size={12} type="material" />
  ) : (
    <FastForward className="h-3 w-3 flex-shrink-0 stroke-[1.5] text-placeholder" />
  );
}
