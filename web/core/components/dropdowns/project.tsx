import { Fragment, ReactNode, useRef, useState } from "react";
import { observer } from "mobx-react";
import { usePopper } from "react-popper";
import { Check, ChevronDown, Search } from "lucide-react";
import { Combobox } from "@headlessui/react";
// types
import { IProject } from "@plane/types";
// components
import { Logo } from "@/components/common";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useProject } from "@/hooks/store";
import { useDropdown } from "@/hooks/use-dropdown";
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
  onChange: (val: string) => void;
  onClose?: () => void;
  renderCondition?: (project: IProject) => boolean;
  value: string | null;
};

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
    onChange,
    onClose,
    placeholder = "Project",
    placement,
    renderCondition,
    showTooltip = false,
    tabIndex,
    value,
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

  const selectedProject = value ? getProjectById(value) : null;

  const { handleClose, handleKeyDown, handleOnClick, searchInputKeyDown } = useDropdown({
    dropdownRef,
    inputRef,
    isOpen,
    onClose,
    query,
    setIsOpen,
    setQuery,
  });

  const dropdownOnChange = (val: string) => {
    onChange(val);
    handleClose();
  };

  return (
    <Combobox
      as="div"
      ref={dropdownRef}
      tabIndex={tabIndex}
      className={cn("h-full", className)}
      value={value}
      onChange={dropdownOnChange}
      disabled={disabled}
      onKeyDown={handleKeyDown}
    >
      <Combobox.Button as={Fragment}>
        {button ? (
          <button
            ref={setReferenceElement}
            type="button"
            className={cn("clickable block h-full w-full outline-none", buttonContainerClassName)}
            onClick={handleOnClick}
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
          >
            <DropdownButton
              className={buttonClassName}
              isActive={isOpen}
              tooltipHeading="Project"
              tooltipContent={selectedProject?.name ?? placeholder}
              showTooltip={showTooltip}
              variant={buttonVariant}
            >
              {!hideIcon && selectedProject && (
                <span className="grid place-items-center flex-shrink-0 h-4 w-4">
                  <Logo logo={selectedProject.logo_props} size={12} />
                </span>
              )}
              {BUTTON_VARIANTS_WITH_TEXT.includes(buttonVariant) && (
                <span className="flex-grow truncate max-w-40">{selectedProject?.name ?? placeholder}</span>
              )}
              {dropdownArrow && (
                <ChevronDown className={cn("h-2.5 w-2.5 flex-shrink-0", dropdownArrowClassName)} aria-hidden="true" />
              )}
            </DropdownButton>
          </button>
        )}
      </Combobox.Button>
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
                placeholder="Search"
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
                  <p className="text-custom-text-400 italic py-1 px-1.5">No matching results</p>
                )
              ) : (
                <p className="text-custom-text-400 italic py-1 px-1.5">Loading...</p>
              )}
            </div>
          </div>
        </Combobox.Options>
      )}
    </Combobox>
  );
});
