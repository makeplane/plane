import { Fragment, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { Combobox } from "@headlessui/react";
import { usePopper } from "react-popper";
import { Check, Search } from "lucide-react";
// hooks
import { useMember, useUser } from "hooks/store";
import { useDropdownKeyDown } from "hooks/use-dropdown-key-down";
import useOutsideClickDetector from "hooks/use-outside-click-detector";
// components
import { BackgroundButton, BorderButton, TransparentButton } from "components/dropdowns";
// icons
import { Avatar } from "@plane/ui";
// helpers
import { cn } from "helpers/common.helper";
// types
import { MemberDropdownProps } from "./types";

export const WorkspaceMemberDropdown: React.FC<MemberDropdownProps> = observer((props) => {
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
    placeholder = "Members",
    placement,
    tabIndex,
    tooltip = false,
    value,
  } = props;
  // states
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  // refs
  const dropdownRef = useRef<HTMLDivElement | null>(null);
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
  const { currentUser } = useUser();
  const {
    getUserDetails,
    workspace: { workspaceMemberIds },
  } = useMember();

  const options = workspaceMemberIds?.map((userId) => {
    const userDetails = getUserDetails(userId);

    return {
      value: userId,
      query: `${userDetails?.display_name} ${userDetails?.first_name} ${userDetails?.last_name}`,
      content: (
        <div className="flex items-center gap-2">
          <Avatar name={userDetails?.display_name} src={userDetails?.avatar} />
          <span className="flex-grow truncate">{currentUser?.id === userId ? "You" : userDetails?.display_name}</span>
        </div>
      ),
    };
  });

  const filteredOptions =
    query === "" ? options : options?.filter((o) => o.query.toLowerCase().includes(query.toLowerCase()));

  const comboboxProps: any = {
    value,
    onChange,
    disabled,
  };
  if (multiple) comboboxProps.multiple = true;

  const openDropdown = () => {
    setIsOpen(true);
    if (referenceElement) referenceElement.focus();
  };
  const closeDropdown = () => setIsOpen(false);
  const handleKeyDown = useDropdownKeyDown(openDropdown, closeDropdown, isOpen);
  useOutsideClickDetector(dropdownRef, closeDropdown);

  return (
    <Combobox
      as="div"
      ref={dropdownRef}
      tabIndex={tabIndex}
      className={cn("h-full", className)}
      {...comboboxProps}
      handleKeyDown={handleKeyDown}
    >
      <Combobox.Button as={Fragment}>
        {button ? (
          <button
            ref={setReferenceElement}
            type="button"
            className={cn("block h-full w-full outline-none", buttonContainerClassName)}
          >
            {button}
          </button>
        ) : (
          <button
            ref={setReferenceElement}
            type="button"
            className={cn(
              "block h-full max-w-full outline-none",
              {
                "cursor-not-allowed text-custom-text-200": disabled,
                "cursor-pointer": !disabled,
              },
              buttonContainerClassName
            )}
          >
            {buttonVariant === "border-with-text" ? (
              <BorderButton
                userIds={value}
                className={buttonClassName}
                dropdownArrow={dropdownArrow && !disabled}
                dropdownArrowClassName={dropdownArrowClassName}
                hideIcon={hideIcon}
                placeholder={placeholder}
                tooltip={tooltip}
              />
            ) : buttonVariant === "border-without-text" ? (
              <BorderButton
                userIds={value}
                className={buttonClassName}
                dropdownArrow={dropdownArrow && !disabled}
                dropdownArrowClassName={dropdownArrowClassName}
                hideIcon={hideIcon}
                placeholder={placeholder}
                tooltip={tooltip}
                hideText
              />
            ) : buttonVariant === "background-with-text" ? (
              <BackgroundButton
                userIds={value}
                className={buttonClassName}
                dropdownArrow={dropdownArrow && !disabled}
                dropdownArrowClassName={dropdownArrowClassName}
                hideIcon={hideIcon}
                placeholder={placeholder}
                tooltip={tooltip}
              />
            ) : buttonVariant === "background-without-text" ? (
              <BackgroundButton
                userIds={value}
                className={buttonClassName}
                dropdownArrow={dropdownArrow && !disabled}
                dropdownArrowClassName={dropdownArrowClassName}
                hideIcon={hideIcon}
                placeholder={placeholder}
                tooltip={tooltip}
                hideText
              />
            ) : buttonVariant === "transparent-with-text" ? (
              <TransparentButton
                userIds={value}
                className={buttonClassName}
                dropdownArrow={dropdownArrow && !disabled}
                dropdownArrowClassName={dropdownArrowClassName}
                hideIcon={hideIcon}
                placeholder={placeholder}
                tooltip={tooltip}
              />
            ) : buttonVariant === "transparent-without-text" ? (
              <TransparentButton
                userIds={value}
                className={buttonClassName}
                dropdownArrow={dropdownArrow && !disabled}
                dropdownArrowClassName={dropdownArrowClassName}
                hideIcon={hideIcon}
                placeholder={placeholder}
                tooltip={tooltip}
                hideText
              />
            ) : null}
          </button>
        )}
      </Combobox.Button>
      <Combobox.Options className="fixed z-10">
        <div
          className="my-1 w-48 rounded border-[0.5px] border-custom-border-300 bg-custom-background-100 px-2 py-2.5 text-xs shadow-custom-shadow-rg focus:outline-none"
          ref={setPopperElement}
          style={styles.popper}
          {...attributes.popper}
        >
          <div className="flex items-center gap-1.5 rounded border border-custom-border-100 bg-custom-background-90 px-2">
            <Search className="h-3.5 w-3.5 text-custom-text-400" strokeWidth={1.5} />
            <Combobox.Input
              className="w-full bg-transparent py-1 text-xs text-custom-text-200 placeholder:text-custom-text-400 focus:outline-none"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              displayValue={(assigned: any) => assigned?.name}
            />
          </div>
          <div className="mt-2 max-h-48 space-y-1 overflow-y-scroll">
            {filteredOptions ? (
              filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <Combobox.Option
                    key={option.value}
                    value={option.value}
                    className={({ active, selected }) =>
                      `w-full truncate flex items-center justify-between gap-2 rounded px-1 py-1.5 cursor-pointer select-none ${
                        active ? "bg-custom-background-80" : ""
                      } ${selected ? "text-custom-text-100" : "text-custom-text-200"}`
                    }
                    onClick={() => {
                      if (!multiple) closeDropdown();
                    }}
                  >
                    {({ selected }) => (
                      <>
                        <span className="flex-grow truncate">{option.content}</span>
                        {selected && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
                      </>
                    )}
                  </Combobox.Option>
                ))
              ) : (
                <p className="text-custom-text-400 italic py-1 px-1.5">No matching results</p>
              )
            ) : (
              <p className="text-custom-text-400 italic py-1 px-1.5">Loading...</p>
            )}
          </div>
        </div>
      </Combobox.Options>
    </Combobox>
  );
});
