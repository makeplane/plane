"use client";

import React, { useRef, useState } from "react";
import { observer } from "mobx-react";
import { Control, Controller } from "react-hook-form";
import { useParams } from "next/navigation";
import { usePopper } from "react-popper";
import { Check, ChevronDown, Search } from "lucide-react";
import { Combobox } from "@headlessui/react";
// plane imports
import { ETabIndices } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { LayersIcon } from "@plane/propel/icons";
import { ComboDropDown } from "@plane/ui";
import { cn, getTabIndex } from "@plane/utils";
// types
import { TBulkIssueProperties, TIssue } from "@plane/types";
import type { EditorRefApi } from "@plane/editor";
// hooks
import { useProjectIssueTypes } from "@/hooks/store/use-project-issue-types";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { useDropdown } from "@/hooks/use-dropdown";
// components
import { DropdownButton } from "@/components/dropdowns/buttons";
import { BUTTON_VARIANTS_WITH_TEXT } from "@/components/dropdowns/constants";
// lucide icons
import * as LucideIcons from "lucide-react";

export type TIssueFields = TIssue & TBulkIssueProperties;

export type TIssueTypeDropdownVariant = "xs" | "sm";

export type TIssueTypeSelectProps<T extends Partial<TIssueFields>> = {
  control: Control<T>;
  projectId: string | null;
  editorRef?: React.MutableRefObject<EditorRefApi | null>;
  disabled?: boolean;
  variant?: TIssueTypeDropdownVariant;
  placeholder?: string;
  isRequired?: boolean;
  renderChevron?: boolean;
  dropDownContainerClassName?: string;
  showMandatoryFieldInfo?: boolean;
  handleFormChange?: () => void;
  buttonVariant?:
    | "border-with-text"
    | "border-without-text"
    | "background-with-text"
    | "background-without-text"
    | "transparent-with-text"
    | "transparent-without-text";
  buttonClassName?: string;
  buttonContainerClassName?: string;
  className?: string;
  hideIcon?: boolean;
  showTooltip?: boolean;
  tabIndex?: number;
};

export const IssueTypeSelect = observer(<T extends Partial<TIssueFields>>(props: TIssueTypeSelectProps<T>) => {
  const {
    control,
    projectId,
    editorRef,
    disabled = false,
    variant = "sm",
    placeholder = "Select type",
    isRequired = false,
    renderChevron = true,
    dropDownContainerClassName,
    handleFormChange,
    buttonVariant = "border-with-text",
    buttonClassName,
    buttonContainerClassName,
    className = "",
    hideIcon = false,
    showTooltip = false,
    tabIndex,
  } = props;

  // refs
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);

  // states
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // hooks
  const { t } = useTranslation();
  const { workspaceSlug } = useParams();
  const { isMobile } = usePlatformOS();
  const { issueTypes, isLoading, error } = useProjectIssueTypes(workspaceSlug?.toString(), projectId || undefined);

  // popper
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

  const { getIndex } = getTabIndex(ETabIndices.ISSUE_FORM, isMobile);

  // dropdown hook
  const { handleClose, handleKeyDown, handleOnClick, searchInputKeyDown } = useDropdown({
    dropdownRef,
    inputRef,
    isOpen,
    onClose: () => setIsOpen(false),
    query,
    setIsOpen,
    setQuery,
  });

  // 如果没有projectId，不渲染组件
  if (!projectId) {
    return null;
  }

  // 渲染类型图标的函数
  const renderTypeIcon = (issueType: any, className: string = "h-3.5 w-3.5") => {
    const { name, color, background_color } = issueType.logo_props?.icon || {};
    const IconComp = name ? ((LucideIcons as any)[name] as React.FC<any> | undefined) : undefined;

    return (
      <span
        className={cn("inline-flex items-center justify-center rounded-sm flex-shrink-0", className)}
        style={{
          backgroundColor: background_color || "transparent",
          color: color || "currentColor",
          width: "16px",
          height: "16px",
        }}
        aria-label={`Issue type: ${issueType.name}`}
      >
        {IconComp ? <IconComp className="h-3.5 w-3.5" strokeWidth={2} /> : <LayersIcon className="h-3.5 w-3.5" />}
      </span>
    );
  };

  // 准备选项数据 - 直接使用issueTypes，不添加"无类型"选项
  const options =
    issueTypes?.map((type) => ({
      value: type.id,
      query: type.name,
      content: (
        <div className="flex items-center gap-2">
          {renderTypeIcon(type)}
          <span className="flex-grow truncate">{type.name}</span>
        </div>
      ),
    })) || [];

  // 直接使用options，不添加默认的"无类型"选项
  const allOptions = options;

  const filteredOptions =
    query === "" ? allOptions : allOptions.filter((option) => option.query.toLowerCase().includes(query.toLowerCase()));

  const getSelectedType = (value: string | null | undefined) => {
    if (!value) return null;
    return issueTypes?.find((type) => type.id === value) || null;
  };

  const getDisplayName = (value: string | null | undefined) => {
    // 如果没有值且有可用的类型，显示第一个类型的名称
    if (!value && issueTypes && issueTypes.length > 0) {
      return issueTypes[0].name;
    }
    const selectedType = getSelectedType(value);
    return selectedType?.name || placeholder;
  };

  const getTypeIcon = (value: string | null | undefined) => {
    if (hideIcon) return null;

    // 如果没有值且有可用的类型，使用第一个类型的图标
    if (!value && issueTypes && issueTypes.length > 0) {
      return renderTypeIcon(issueTypes[0], "h-3 w-3 flex-shrink-0");
    }

    const selectedType = getSelectedType(value);
    if (selectedType) {
      return renderTypeIcon(selectedType, "h-3 w-3 flex-shrink-0");
    }

    return <LayersIcon className="h-3 w-3 flex-shrink-0" />;
  };

  return (
    <Controller
      control={control}
      name={"type_id" as any}
      rules={{
        required: isRequired,
      }}
      render={({ field: { value, onChange }, fieldState: { error: fieldError } }) => {
        const dropdownOnChange = (val: string) => {
          onChange(val);
          handleFormChange?.();
          handleClose();
        };

        // 如果没有值且有可用的类型，自动设置为第一个类型
        React.useEffect(() => {
          if (!value && issueTypes && issueTypes.length > 0) {
            onChange(issueTypes[0].id);
          }
        }, [value, issueTypes, onChange]);

        const comboButton = (
          <button
            ref={setReferenceElement}
            type="button"
            className={cn(
              "clickable block h-full max-w-full outline-none",
              {
                "cursor-not-allowed text-custom-text-200": disabled || isLoading,
                "cursor-pointer": !disabled && !isLoading,
              },
              buttonContainerClassName
            )}
            onClick={handleOnClick}
            disabled={disabled || isLoading}
          >
            <DropdownButton
              className={cn(buttonClassName, {
                "border-red-500": fieldError,
              })}
              isActive={isOpen}
              tooltipHeading="Type"
              tooltipContent={getDisplayName(value)}
              showTooltip={showTooltip}
              variant={buttonVariant}
            >
              {getTypeIcon(value)}
              {BUTTON_VARIANTS_WITH_TEXT.includes(buttonVariant) && (
                <span className="truncate max-w-40">{getDisplayName(value)}</span>
              )}
              {renderChevron && <ChevronDown className="h-2.5 w-2.5 flex-shrink-0" aria-hidden="true" />}
            </DropdownButton>
          </button>
        );

        return (
          <div className={cn("relative h-7", dropDownContainerClassName)}>
            <ComboDropDown
              as="div"
              ref={dropdownRef}
              tabIndex={tabIndex || getIndex("type_id")}
              className={cn("h-full", className)}
              value={value || ""}
              onChange={dropdownOnChange}
              disabled={disabled || isLoading}
              onKeyDown={handleKeyDown}
              button={comboButton}
            >
              {isOpen && (
                <Combobox.Options className="fixed z-10" static>
                  <div
                    className="my-1 w-48 rounded border-[0.5px] border-custom-border-300 bg-custom-background-100 px-2 py-2.5 text-xs shadow-custom-shadow-rg focus:outline-none"
                    ref={setPopperElement}
                    style={styles.popper}
                    {...attributes.popper}
                  >
                    <div className="flex items-center gap-1.5 rounded border border-custom-border-100 bg-custom-background-90 px-2">
                      <Search className="h-3.5 w-3.5 text-custom-text-400" strokeWidth={1.5} />
                      <Combobox.Input
                        as="input"
                        ref={inputRef}
                        className="w-full bg-transparent py-1 text-xs text-custom-text-200 placeholder:text-custom-text-400 focus:outline-none"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={t("search") || "Search"}
                        onKeyDown={searchInputKeyDown}
                      />
                    </div>
                    <div className="mt-2 max-h-48 overflow-auto">
                      {isLoading ? (
                        <div className="flex items-center justify-center py-2">
                          <div className="w-4 h-4 border-2 border-custom-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : filteredOptions.length > 0 ? (
                        filteredOptions.map((option) => (
                          <Combobox.Option
                            key={option.value}
                            value={option.value}
                            className={({ active, selected }) =>
                              cn(
                                "flex cursor-pointer select-none items-center justify-between gap-2 truncate rounded px-1 py-1.5",
                                {
                                  "bg-custom-background-80": active,
                                  "text-custom-text-100": selected,
                                  "text-custom-text-200": !selected,
                                }
                              )
                            }
                          >
                            {({ selected }) => (
                              <>
                                {option.content}
                                {selected && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
                              </>
                            )}
                          </Combobox.Option>
                        ))
                      ) : (
                        <div className="flex items-center justify-center py-2 text-custom-text-400">
                          {t("no_results_found") || "No results found"}
                        </div>
                      )}
                    </div>
                  </div>
                </Combobox.Options>
              )}
            </ComboDropDown>

            {/* 错误提示 */}
            {fieldError && <p className="mt-1 text-xs text-red-500">{fieldError.message}</p>}

            {/* 错误状态指示器 */}
            {error && !isLoading && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <div className="w-4 h-4 text-red-500" title={error}>
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            )}
          </div>
        );
      }}
    />
  );
});
