import { ReactNode, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { usePopper } from "react-popper";
import useSWR from "swr";
import { Check, ChevronDown, Search } from "lucide-react";
import { Combobox } from "@headlessui/react";
// ui
import { useTranslation } from "@plane/i18n";
import { EpicIcon } from "@plane/propel/icons";
import { TWorkspaceEpicsSearchParams } from "@plane/types";
import { ComboDropDown } from "@plane/ui";
// helpers
import { cn } from "@plane/utils";
import { DropdownButton } from "@/components/dropdowns/buttons";
import { BUTTON_VARIANTS_WITH_TEXT } from "@/components/dropdowns/constants";
import { TDropdownProps } from "@/components/dropdowns/types";
// hooks
import { useDropdown } from "@/hooks/use-dropdown";
// plane web types
import { WorkspaceService } from "@/plane-web/services";

type Props = TDropdownProps & {
  button?: ReactNode;
  dropdownArrow?: boolean;
  dropdownArrowClassName?: string;
  onClose?: () => void;
  renderByDefault?: boolean;
  searchParams: Partial<TWorkspaceEpicsSearchParams>;
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
const workspaceService = new WorkspaceService();
export const EpicsDropdown: React.FC<Props> = observer((props) => {
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
    placeholder = "Epic",
    placement,
    showTooltip = false,
    tabIndex,
    value,
    renderByDefault = true,
    searchParams,
  } = props;
  // router
  const { workspaceSlug } = useParams();
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
  const { t } = useTranslation();
  const { handleClose, handleKeyDown, handleOnClick, searchInputKeyDown } = useDropdown({
    dropdownRef,
    inputRef,
    isOpen,
    onClose,
    query,
    setIsOpen,
    setQuery,
  });
  const { data: epics, isLoading } = useSWR(
    workspaceSlug ? `WORKSPACE_EPICS_${workspaceSlug}` : null,
    workspaceSlug ? () => workspaceService.fetchWorkspaceEpics(workspaceSlug.toString(), {}) : null,
    {
      revalidateOnFocus: false,
    }
  );

  const getEpicById = (id: string) => epics?.find((epic) => epic.id === id);
  const filteredEpics = epics
    ? query
      ? epics?.filter((epic) => epic.name.toLowerCase().includes(query.toLowerCase()))
      : epics
    : [];

  const dropdownOnChange = (val: string & string[]) => {
    onChange(val);
    if (!multiple) handleClose();
  };
  const getDisplayName = (value: string | string[] | null, placeholder: string = "") => {
    if (Array.isArray(value)) {
      const firstEpic = getEpicById(value[0]);
      return value.length ? (value.length === 1 ? firstEpic?.name : `${value.length} epics`) : placeholder;
    } else {
      return value ? (getEpicById(value)?.name ?? placeholder) : placeholder;
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
            tooltipHeading="Epic"
            tooltipContent={value?.length ? `${value.length} epic${value.length !== 1 ? "s" : ""}` : placeholder}
            showTooltip={showTooltip}
            variant={buttonVariant}
            renderToolTipByDefault={renderByDefault}
          >
            {!hideIcon && <EpicIcon className="h-4 w-4 text-custom-text-300" />}
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
      {isOpen &&
        (isLoading ? (
          <div className="my-1 w-48 rounded border-[0.5px] border-custom-border-300 bg-custom-background-100 px-2 py-2.5 text-xs shadow-custom-shadow-rg focus:outline-none">
            <p className="text-custom-text-400 italic py-1 px-1.5">{t("loading")}</p>
          </div>
        ) : (
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
                {filteredEpics ? (
                  filteredEpics.length > 0 ? (
                    filteredEpics.map((option) => {
                      if (!option) return;
                      return (
                        <Combobox.Option
                          key={option.id}
                          value={option.id}
                          className={({ active, selected }) =>
                            `w-full truncate flex items-center justify-between gap-2 rounded px-1 py-1.5 cursor-pointer select-none ${
                              active ? "bg-custom-background-80" : ""
                            } ${selected ? "text-custom-text-100" : "text-custom-text-200"}`
                          }
                        >
                          {({ selected }) => (
                            <>
                              <EpicIcon className="h-4 w-4 text-custom-text-300" />
                              <span className="flex-grow truncate">{option.name}</span>
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
        ))}
    </ComboDropDown>
  );
});
