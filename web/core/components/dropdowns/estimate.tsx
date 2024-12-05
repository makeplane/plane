import { ReactNode, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { usePopper } from "react-popper";
import { Check, ChevronDown, Search, Triangle } from "lucide-react";
import { Combobox } from "@headlessui/react";
// ui
import { ComboDropDown } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import {
  useEstimate,
  useProjectEstimates,
  //  useEstimate
} from "@/hooks/store";
import { useDropdown } from "@/hooks/use-dropdown";
// components
import { DropdownButton } from "./buttons";
import { BUTTON_VARIANTS_WITH_TEXT } from "./constants";
// types
import { TDropdownProps } from "./types";

type Props = TDropdownProps & {
  button?: ReactNode;
  dropdownArrow?: boolean;
  dropdownArrowClassName?: string;
  onChange: (val: string | undefined) => void;
  onClose?: () => void;
  projectId: string | undefined;
  value: string | undefined | null;
  renderByDefault?: boolean;
};

type DropdownOptions =
  | {
      value: string | null;
      query: string;
      content: JSX.Element;
    }[]
  | undefined;

export const EstimateDropdown: React.FC<Props> = observer((props) => {
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
    placeholder = "",
    placement,
    projectId,
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
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { currentActiveEstimateIdByProjectId, getProjectEstimates } = useProjectEstimates();
  const { estimatePointIds, estimatePointById } = useEstimate(
    projectId ? currentActiveEstimateIdByProjectId(projectId) : undefined
  );

  const currentActiveEstimateId = projectId ? currentActiveEstimateIdByProjectId(projectId) : undefined;

  const options: DropdownOptions = (estimatePointIds ?? [])
    ?.map((estimatePoint) => {
      const currentEstimatePoint = estimatePointById(estimatePoint);
      if (currentEstimatePoint)
        return {
          value: currentEstimatePoint.id,
          query: `${currentEstimatePoint?.value}`,
          content: (
            <div className="flex items-center gap-2">
              <Triangle className="h-3 w-3 flex-shrink-0" />
              <span className="flex-grow truncate">{currentEstimatePoint.value}</span>
            </div>
          ),
        };
      else undefined;
    })
    .filter((estimatePointDropdownOption) => estimatePointDropdownOption != undefined) as DropdownOptions;
  options?.unshift({
    value: null,
    query: "No estimate",
    content: (
      <div className="flex items-center gap-2">
        <Triangle className="h-3 w-3 flex-shrink-0" />
        <span className="flex-grow truncate">No estimate</span>
      </div>
    ),
  });

  const filteredOptions =
    query === "" ? options : options?.filter((o) => o.query.toLowerCase().includes(query.toLowerCase()));

  const selectedEstimate = value && estimatePointById ? estimatePointById(value) : undefined;

  const onOpen = async () => {
    if (!currentActiveEstimateId && workspaceSlug && projectId)
      await getProjectEstimates(workspaceSlug.toString(), projectId);
  };

  const { handleClose, handleKeyDown, handleOnClick, searchInputKeyDown } = useDropdown({
    dropdownRef,
    inputRef,
    isOpen,
    onClose,
    onOpen,
    query,
    setIsOpen,
    setQuery,
  });

  const dropdownOnChange = (val: string | undefined) => {
    onChange(val);
    handleClose();
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
            tooltipHeading="Estimate"
            tooltipContent={selectedEstimate ? selectedEstimate?.value : placeholder}
            showTooltip={showTooltip}
            variant={buttonVariant}
            renderToolTipByDefault={renderByDefault}
          >
            {!hideIcon && <Triangle className="h-3 w-3 flex-shrink-0" />}
            {(selectedEstimate || placeholder) && BUTTON_VARIANTS_WITH_TEXT.includes(buttonVariant) && (
              <span className="flex-grow truncate">{selectedEstimate ? selectedEstimate?.value : placeholder}</span>
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
      className={cn("h-full w-full", className)}
      value={value}
      onChange={dropdownOnChange}
      disabled={disabled}
      onKeyDown={handleKeyDown}
      button={comboButton}
      renderByDefault={renderByDefault}
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
                placeholder="Search"
                displayValue={(assigned: any) => assigned?.name}
                onKeyDown={searchInputKeyDown}
              />
            </div>
            <div className="mt-2 max-h-48 space-y-1 overflow-y-scroll">
              {currentActiveEstimateId === undefined ? (
                <div
                  className={`flex w-full cursor-pointer select-none items-center justify-between gap-2 truncate rounded px-1 py-1.5 text-custom-text-200`}
                >
                  {/* NOTE: This condition renders when estimates are not enabled for the project */}
                  <div className="flex-grow flex items-center gap-2">
                    <Triangle className="h-3 w-3 flex-shrink-0" />
                    <span className="flex-grow truncate">No estimate</span>
                  </div>
                </div>
              ) : (
                <>
                  {filteredOptions ? (
                    filteredOptions.length > 0 ? (
                      filteredOptions.map((option) => (
                        <Combobox.Option key={option.value} value={option.value}>
                          {({ active, selected }) => (
                            <div
                              className={cn(
                                "flex w-full cursor-pointer select-none items-center justify-between gap-2 truncate rounded px-1 py-1.5",
                                {
                                  "bg-custom-background-80": active,
                                  "text-custom-text-100": selected,
                                  "text-custom-text-200": !selected,
                                }
                              )}
                            >
                              <span className="flex-grow truncate">{option.content}</span>
                              {selected && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
                            </div>
                          )}
                        </Combobox.Option>
                      ))
                    ) : (
                      <p className="px-1.5 py-1 italic text-custom-text-400">No matching results</p>
                    )
                  ) : (
                    <p className="px-1.5 py-1 italic text-custom-text-400">Loading...</p>
                  )}
                </>
              )}
            </div>
          </div>
        </Combobox.Options>
      )}
    </ComboDropDown>
  );
});
