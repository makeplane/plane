import { ReactNode, useRef, useState } from "react";
import { observer } from "mobx-react";
import { usePopper } from "react-popper";
import { Briefcase, Check, ChevronDown, Search } from "lucide-react";
import { Combobox } from "@headlessui/react";
// ui
import { useTranslation } from "@plane/i18n";
import { ComboDropDown } from "@plane/ui";
// components
import { Logo } from "@/components/common";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useProject } from "@/hooks/store";
import { useDropdown } from "@/hooks/use-dropdown";
// plane web types
import { TProject } from "@/plane-web/types";
// components
import { DropdownButton } from "./buttons";
// constants
import { BUTTON_VARIANTS_WITH_TEXT } from "./constants";
// types
import { TDropdownProps } from "./types";

type Props = TDropdownProps & {
  button?: ReactNode;
  dropdownArrow?: boolean;
  dropdownArrowClassName?: string;
  onClose?: () => void;
  renderCondition?: (project: TProject) => boolean;
  renderByDefault?: boolean;
} & (
    | {
        multiple: false;
        onChange: (val: string) => void;
        value: string | null;
      }
    | {
        multiple: true;
        onChange: (val: string[]) => void;
        value: string[];
      }
  );

export const ProjectDropdown: React.FC<Props> = observer((props) => {
  const {
    button,
    buttonClassName,
    buttonContainerClassName,
    buttonVariant,
    className = "",
    disabled = false,
    dropdownArrow = false,
    dropdownArrowClassName = "",
    hideIcon = false,
    multiple,
    onChange,
    onClose,
    placeholder = "Project",
    placement,
    renderCondition,
    showTooltip = false,
    tabIndex,
    value,
    renderByDefault = true,
  } = props;
  // states
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  // refs
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  // popper-js refs
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  // popper-js init
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: placement ?? "bottom-start",
    modifiers: [
      {
        name: "preventOverflow",
        options: {
          padding: 12,
        },
      },
    ],
  });
  // store hooks
  const { joinedProjectIds, getProjectById } = useProject();
  const { t } = useTranslation();
  const options = joinedProjectIds?.map((projectId) => {
    const projectDetails = getProjectById(projectId);
    if (renderCondition && projectDetails && !renderCondition(projectDetails)) return;
    return {
      value: projectId,
      query: `${projectDetails?.name}`,
      content: (
        <div className="flex items-center gap-2">
          {projectDetails && (
            <span className="grid place-items-center flex-shrink-0 h-4 w-4">
              <Logo logo={projectDetails?.logo_props} size={12} />
            </span>
          )}
          <span className="flex-grow truncate">{projectDetails?.name}</span>
        </div>
      ),
    };
  });

  const filteredOptions =
    query === "" ? options : options?.filter((o) => o?.query.toLowerCase().includes(query.toLowerCase()));

  const { handleClose, handleKeyDown, handleOnClick, searchInputKeyDown } = useDropdown({
    dropdownRef,
    inputRef,
    isOpen,
    onClose,
    query,
    setIsOpen,
    setQuery,
  });

  const dropdownOnChange = (val: string & string[]) => {
    onChange(val);
    if (!multiple) handleClose();
  };

  const getDisplayName = (value: string | string[] | null, placeholder: string = "") => {
    if (Array.isArray(value)) {
      const firstProject = getProjectById(value[0]);
      return value.length ? (value.length === 1 ? firstProject?.name : `${value.length} projects`) : placeholder;
    } else {
      return value ? (getProjectById(value)?.name ?? placeholder) : placeholder;
    }
  };

  const getProjectIcon = (value: string | string[] | null) => {
    const renderIcon = (projectDetails: TProject) => (
      <span className="grid place-items-center flex-shrink-0 h-4 w-4">
        <Logo logo={projectDetails.logo_props} size={14} />
      </span>
    );

    if (Array.isArray(value)) {
      return (
        <div className="flex items-center gap-0.5">
          {value.length > 0 ? (
            value.map((projectId) => {
              const projectDetails = getProjectById(projectId);
              return projectDetails ? renderIcon(projectDetails) : null;
            })
          ) : (
            <Briefcase className="size-3 text-custom-text-300" />
          )}
        </div>
      );
    } else {
      const projectDetails = getProjectById(value);
      return projectDetails ? renderIcon(projectDetails) : null;
    }
  };

  const comboButton = (
    <>
      {button ? (
        <button
          ref={setReferenceElement}
          type="button"
          className={cn("clickable block h-full w-full outline-none", buttonContainerClassName)}
          onClick={handleOnClick}
          disabled={disabled}
        >
          {button}
        </button>
      ) : (
        <button
          ref={setReferenceElement}
          type="button"
          className={cn(
            "clickable block h-full max-w-full outline-none",
            {
              "cursor-not-allowed text-custom-text-200": disabled,
              "cursor-pointer": !disabled,
            },
            buttonContainerClassName
          )}
          onClick={handleOnClick}
          disabled={disabled}
        >
          <DropdownButton
            className={buttonClassName}
            isActive={isOpen}
            tooltipHeading="Project"
            tooltipContent={value?.length ? `${value.length} project${value.length !== 1 ? "s" : ""}` : placeholder}
            showTooltip={showTooltip}
            variant={buttonVariant}
            renderToolTipByDefault={renderByDefault}
          >
            {!hideIcon && getProjectIcon(value)}
            {BUTTON_VARIANTS_WITH_TEXT.includes(buttonVariant) && (
              <span className="flex-grow truncate max-w-40">{getDisplayName(value, placeholder)}</span>
            )}
            {dropdownArrow && (
              <ChevronDown className={cn("h-2.5 w-2.5 flex-shrink-0", dropdownArrowClassName)} aria-hidden="true" />
            )}
          </DropdownButton>
        </button>
      )}
    </>
  );

  return (
    <ComboDropDown
      as="div"
      ref={dropdownRef}
      tabIndex={tabIndex}
      className={cn("h-full", className)}
      value={value}
      onChange={dropdownOnChange}
      disabled={disabled}
      onKeyDown={handleKeyDown}
      button={comboButton}
      renderByDefault={renderByDefault}
      multiple={multiple}
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
                placeholder={t("search")}
                displayValue={(assigned: any) => assigned?.name}
                onKeyDown={searchInputKeyDown}
              />
            </div>
            <div className="mt-2 max-h-48 space-y-1 overflow-y-scroll">
              {filteredOptions ? (
                filteredOptions.length > 0 ? (
                  filteredOptions.map((option) => {
                    if (!option) return;
                    return (
                      <Combobox.Option
                        key={option.value}
                        value={option.value}
                        className={({ active, selected }) =>
                          `w-full truncate flex items-center justify-between gap-2 rounded px-1 py-1.5 cursor-pointer select-none ${
                            active ? "bg-custom-background-80" : ""
                          } ${selected ? "text-custom-text-100" : "text-custom-text-200"}`
                        }
                      >
                        {({ selected }) => (
                          <>
                            <span className="flex-grow truncate">{option.content}</span>
                            {selected && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
                          </>
                        )}
                      </Combobox.Option>
                    );
                  })
                ) : (
                  <p className="text-custom-text-400 italic py-1 px-1.5">{t("no_matching_results")}</p>
                )
              ) : (
                <p className="text-custom-text-400 italic py-1 px-1.5">{t("loading")}</p>
              )}
            </div>
          </div>
        </Combobox.Options>
      )}
    </ComboDropDown>
  );
});
