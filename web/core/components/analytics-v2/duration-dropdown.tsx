// plane package imports
import { PROJECT_CREATED_AT_FILTER_OPTIONS } from '@plane/constants'
import { useTranslation } from '@plane/i18n'
import { ComboDropDown } from '@plane/ui'
import { cn } from '@plane/utils'
// plane web components
import { Combobox } from '@headlessui/react'
import { Check, ChevronDown, Search } from 'lucide-react'
import React, { ReactNode, useRef, useState } from 'react'
import { usePopper } from 'react-popper'
// components
import { DropdownButton } from '@/components/dropdowns/buttons'
import { BUTTON_VARIANTS_WITH_TEXT } from '@/components/dropdowns/constants'
import { TDropdownProps } from '@/components/dropdowns/types'
// hooks
import { useDropdown } from '@/hooks/use-dropdown'

type Props = TDropdownProps & {
  value: string | null
  onChange: (val: typeof PROJECT_CREATED_AT_FILTER_OPTIONS[number]['value']) => void
  //optional
  button?: ReactNode
  dropdownArrow?: boolean
  dropdownArrowClassName?: string
  onClose?: () => void
  renderByDefault?: boolean
  tabIndex?: number
}

function DurationDropdown({
  buttonClassName,
  buttonContainerClassName,
  buttonVariant,
  className,
  disabled,
  hideIcon,
  placeholder = "Duration",
  onClose,
  placement,
  onChange,
  showTooltip = false,
  dropdownArrow = false,
  dropdownArrowClassName = "",
  button,
  renderByDefault = true,
  tabIndex,
  value
}: Props) {
  //states
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  //refs
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  //popper-js refs
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null)
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null)
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
  //store hooks
  const { t } = useTranslation()
  const { handleOnClick, handleClose, searchInputKeyDown } = useDropdown({
    dropdownRef,
    inputRef,
    isOpen,
    onClose,
    query,
    setIsOpen,
    setQuery
  })
  const filteredOptions =
    query === "" ? PROJECT_CREATED_AT_FILTER_OPTIONS : PROJECT_CREATED_AT_FILTER_OPTIONS?.filter((o) => o?.name.toLowerCase().includes(query.toLowerCase()));

  const dropdownOnChange = (val: typeof PROJECT_CREATED_AT_FILTER_OPTIONS[number]["value"]) => {
    onChange(val)
    handleClose()
  }

  const getDisplayName = (value: string | string[] | null, placeholder: string = "") => {
    const option = filteredOptions?.find((o) => o?.value === value)
    return option ? option?.name : placeholder;

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
            tooltipHeading="Duration"
            tooltipContent={value?.length ? `${value.length} duration ${value.length !== 1 ? "s" : ""}` : placeholder}
            showTooltip={showTooltip}
            variant={buttonVariant}
            renderToolTipByDefault={renderByDefault}
          >
            {/* {!hideIcon && getProjectIcon(value)} */}
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
      as="button"
      ref={dropdownRef}
      tabIndex={tabIndex}
      className={cn("h-full", className)}
      value={value}
      onChange={dropdownOnChange}
      button={comboButton}
    >
      {isOpen &&
        <Combobox.Options className="fixed z-10" static>
          <div
            className="my-1 w-48 rounded border-[0.5px] border-custom-border-300 bg-custom-background-100 px-2 py-2.5 text-xs shadow-custom-shadow-rg focus:outline-none"
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
          >
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
                          `w-full truncate flex items-center justify-between gap-2 rounded px-1 py-1.5 cursor-pointer select-none ${active ? "bg-custom-background-80" : ""
                          } ${selected ? "text-custom-text-100" : "text-custom-text-200"}`
                        }
                      >
                        {({ selected }) => (
                          <>
                            <span className="flex-grow truncate text-left">{option.name}</span>
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
      }
    </ComboDropDown>
  )
}

export default DurationDropdown