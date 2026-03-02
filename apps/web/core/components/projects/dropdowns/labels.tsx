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

import { useRef, useState } from "react";
import { observer } from "mobx-react";
import { usePopper } from "react-popper";
import { Plus, Search } from "lucide-react";
import { Combobox } from "@headlessui/react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { CheckIcon, LabelPropertyIcon } from "@plane/propel/icons";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { Tooltip } from "@plane/propel/tooltip";
import { ComboDropDown } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import { useWorkspaceProjectLabels } from "@/hooks/store/use-workspace-project-labels";
import { useUserPermissions } from "@/hooks/store/user";
import { useDropdown } from "@/hooks/use-dropdown";

type Props = {
  value: string[];
  onChange: (labelIds: string[]) => void;
  workspaceSlug: string;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  button?: React.ReactNode;
};

export const LabelsDropdown = observer(function LabelsDropdown(props: Props) {
  const { value, onChange, workspaceSlug, disabled = false, className = "", buttonClassName = "", button } = props;
  // states
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  // refs
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  // popper-js refs
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  // popper-js init
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "bottom-start",
    modifiers: [
      {
        name: "preventOverflow",
        options: {
          padding: 12,
        },
      },
    ],
  });
  // i18n
  const { t } = useTranslation();
  // store hooks
  const { workspaceLabels, getLabelById, createLabel } = useWorkspaceProjectLabels();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const isAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);

  const options = (workspaceLabels ?? []).map((label) => ({
    value: label.id,
    query: label.name,
    content: (
      <div className="flex items-center gap-2">
        <LabelPropertyIcon color={label.color} className="h-2.5 w-2.5 flex-shrink-0" />
        <span className="flex-grow truncate">{label.name}</span>
      </div>
    ),
  }));

  const filteredOptions =
    query === "" ? options : options.filter((o) => o.query.toLowerCase().includes(query.toLowerCase()));

  const handleLabelToggle = (labelId: string) => {
    const newValue = value.includes(labelId) ? value.filter((id) => id !== labelId) : [...value, labelId];
    onChange(newValue);
  };

  const { handleKeyDown, handleOnClick, searchInputKeyDown } = useDropdown({
    dropdownRef,
    inputRef,
    isOpen,
    onClose: () => {
      setIsCreating(false);
      setNewLabelName("");
    },
    query,
    setIsOpen,
    setQuery,
  });

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) return;
    try {
      const randomColor = `#${Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, "0")}`;
      const label = await createLabel(workspaceSlug, { name: newLabelName.trim(), color: randomColor });
      onChange([...value, label.id]);
      setNewLabelName("");
      setIsCreating(false);
    } catch (error: any) {
      const errorMessage = error?.data?.name?.[0] || error?.name?.[0] || t("failed_to_create_label");
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: errorMessage,
      });
    }
  };

  // Build display for the button
  const selectedLabels = value.map((id) => getLabelById(id)).filter(Boolean);

  const comboButton = (
    <button
      ref={setReferenceElement}
      type="button"
      className={cn("clickable block h-full w-full outline-none", {
        "cursor-not-allowed text-secondary": disabled,
        "cursor-pointer": !disabled,
      })}
      onClick={handleOnClick}
    >
      {button || (
        <Tooltip tooltipContent={t("labels")} position="top">
          <div
            className={cn(
              "px-2 text-11 h-full flex cursor-pointer items-center gap-1.5 text-secondary border-[0.5px] border-subtle-1 hover:bg-layer-1 rounded",
              { "cursor-not-allowed": disabled },
              buttonClassName
            )}
          >
            {selectedLabels.length > 0 ? (
              <>
                {selectedLabels.slice(0, 2).map((label) => (
                  <span key={label!.id} className="flex items-center gap-1 flex-shrink-0">
                    <LabelPropertyIcon color={label!.color} className="size-3 flex-shrink-0" />
                    <span className="truncate max-w-[60px]">{label!.name}</span>
                  </span>
                ))}
                {selectedLabels.length > 2 && (
                  <span className="flex-shrink-0 text-tertiary">+{selectedLabels.length - 2}</span>
                )}
              </>
            ) : (
              <>
                <LabelPropertyIcon className="h-3 w-3 flex-shrink-0" />
                <span>{t("labels")}</span>
              </>
            )}
          </div>
        </Tooltip>
      )}
    </button>
  );

  return (
    <ComboDropDown
      ref={dropdownRef}
      as="div"
      className={cn("h-full", { "bg-layer-1": isOpen }, className)}
      value={value}
      onChange={() => {}}
      disabled={disabled}
      onKeyDown={handleKeyDown}
      multiple
      button={comboButton}
      renderByDefault
    >
      {isOpen && (
        <Combobox.Options className="fixed z-10" static>
          <div
            className="my-1 w-48 rounded-sm border-[0.5px] border-subtle-1 bg-surface-1 px-2 py-2.5 text-11 shadow-raised-200 focus:outline-none"
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
          >
            <div className="flex items-center gap-1.5 rounded-sm border border-subtle bg-layer-1 px-2">
              <Search className="h-3.5 w-3.5 text-placeholder" strokeWidth={1.5} />
              <Combobox.Input
                as="input"
                ref={inputRef}
                className="w-full bg-transparent py-1 text-11 text-secondary placeholder:text-placeholder focus:outline-none"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("search")}
                displayValue={() => query}
                onKeyDown={searchInputKeyDown}
              />
            </div>
            <div className="mt-2 max-h-48 space-y-1 overflow-y-scroll">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <Combobox.Option
                    key={option.value}
                    value={option.value}
                    className={({ active }) =>
                      cn(
                        "w-full truncate flex items-center justify-between gap-2 rounded-sm px-1 py-1.5 cursor-pointer select-none",
                        { "bg-layer-1": active }
                      )
                    }
                    onClick={(e) => {
                      e.preventDefault();
                      handleLabelToggle(option.value);
                    }}
                  >
                    <>
                      <span className="flex-grow truncate">{option.content}</span>
                      {value.includes(option.value) && <CheckIcon className="h-3.5 w-3.5 flex-shrink-0 text-primary" />}
                    </>
                  </Combobox.Option>
                ))
              ) : (
                <p className="text-placeholder italic py-1 px-1.5">{t("no_matching_results")}</p>
              )}
            </div>
            {/* Create new label */}
            {isAdmin && (
              <div className="mt-2 border-t border-subtle pt-2">
                {isCreating ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      className="w-full bg-transparent py-1 text-11 text-secondary placeholder:text-placeholder focus:outline-none border border-subtle rounded-sm px-2"
                      value={newLabelName}
                      onChange={(e) => setNewLabelName(e.target.value)}
                      placeholder={t("label_name")}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          e.stopPropagation();
                          void handleCreateLabel();
                        }
                        if (e.key === "Escape") {
                          setIsCreating(false);
                          setNewLabelName("");
                        }
                      }}
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-sm px-1 py-1.5 text-secondary hover:bg-layer-1 cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsCreating(true);
                    }}
                  >
                    <Plus className="h-3 w-3 flex-shrink-0" />
                    <span>{t("create_new_label")}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </Combobox.Options>
      )}
    </ComboDropDown>
  );
});
