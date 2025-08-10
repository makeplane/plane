import { Listbox } from "@headlessui/react";
import { Check, ChevronDown } from "lucide-react";
import React, { useRef, useState, useCallback, useEffect } from "react";
// plane helpers
import { useOutsideClickDetector } from "@plane/hooks";
// helpers
import { cn } from "../../helpers";
// hooks
import { useDropdownKeyDown } from "../hooks/use-dropdown-key-down";
// types
import { ICustomSelectItemProps, ICustomSelectProps, Placement } from "./helper";

// Custom positioning hook to replace usePopper
const useCustomPositioning = (
  referenceElement: HTMLButtonElement | null,
  popperElement: HTMLDivElement | null,
  placement: Placement = "bottom-start",
  isOpen: boolean
) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [actualPlacement, setActualPlacement] = useState(placement);

  const calculatePosition = useCallback(() => {
    if (!referenceElement || !popperElement) return;

    const rect = referenceElement.getBoundingClientRect();
    const popperRect = popperElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = 0;
    let left = 0;
    let newPlacement = placement;

    // Calculate initial position based on placement
    switch (placement) {
      case "bottom-start":
        top = rect.bottom + window.scrollY;
        left = rect.left + window.scrollX;
        break;
      case "bottom-end":
        top = rect.bottom + window.scrollY;
        left = rect.right + window.scrollX - popperRect.width;
        break;
      case "top-left":
        top = rect.top + window.scrollY - popperRect.height;
        left = rect.left + window.scrollX;
        break;
      case "top-right":
        top = rect.top + window.scrollY - popperRect.height;
        left = rect.right + window.scrollX - popperRect.width;
        break;
      case "left-top":
        top = rect.top + window.scrollY;
        left = rect.left + window.scrollX - popperRect.width;
        break;
      case "left-bottom":
        top = rect.bottom + window.scrollY - popperRect.height;
        left = rect.left + window.scrollX - popperRect.width;
        break;
      case "right-top":
        top = rect.top + window.scrollY;
        left = rect.right + window.scrollX;
        break;
      case "right-bottom":
        top = rect.bottom + window.scrollY - popperRect.height;
        left = rect.right + window.scrollX;
        break;
      default:
        top = rect.bottom + window.scrollY;
        left = rect.left + window.scrollX;
    }

    // Adjust position if it goes outside viewport
    const adjustedTop = Math.max(0, Math.min(top, viewportHeight - popperRect.height));
    const adjustedLeft = Math.max(0, Math.min(left, viewportWidth - popperRect.width));

    // Determine if we need to flip placement
    if (placement.includes("bottom") && adjustedTop !== top) {
      newPlacement = placement.includes("start") ? "top-left" : "top-right";
    } else if (placement.includes("top") && adjustedTop !== top) {
      newPlacement = placement.includes("start") ? "bottom-start" : "bottom-end";
    } else if (placement.includes("left") && adjustedLeft !== left) {
      newPlacement = placement.includes("top") ? "right-top" : "right-bottom";
    } else if (placement.includes("right") && adjustedLeft !== left) {
      newPlacement = placement.includes("top") ? "left-top" : "left-bottom";
    }

    setPosition({ top: adjustedTop, left: adjustedLeft });
    setActualPlacement(newPlacement);
  }, [referenceElement, popperElement, placement, isOpen]);

  useEffect(() => {
    if (isOpen) {
      calculatePosition();
      window.addEventListener("resize", calculatePosition);
      window.addEventListener("scroll", calculatePosition);

      return () => {
        window.removeEventListener("resize", calculatePosition);
        window.removeEventListener("scroll", calculatePosition);
      };
    }
  }, [calculatePosition, isOpen]);

  return {
    styles: {
      popper: {
        position: "absolute" as const,
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 20,
      },
    },
    attributes: {
      popper: {
        "data-placement": actualPlacement,
      },
    },
  };
};

const CustomSelect = (props: ICustomSelectProps) => {
  const {
    customButtonClassName = "",
    buttonClassName = "",
    placement,
    children,
    className = "",
    customButton,
    disabled = false,
    input = false,
    label,
    maxHeight = "md",
    noChevron = false,
    onChange,
    optionsClassName = "",
    value,
    tabIndex,
  } = props;
  // states
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  // refs
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const { styles, attributes } = useCustomPositioning(referenceElement, popperElement, placement, isOpen);

  const openDropdown = () => {
    setIsOpen(true);
    if (referenceElement) referenceElement.focus();
  };
  const closeDropdown = () => setIsOpen(false);
  const handleKeyDown = useDropdownKeyDown(openDropdown, closeDropdown, isOpen);
  useOutsideClickDetector(dropdownRef, closeDropdown);

  const toggleDropdown = () => {
    if (isOpen) closeDropdown();
    else openDropdown();
  };

  return (
    <Listbox
      as="div"
      ref={dropdownRef}
      tabIndex={tabIndex}
      value={value}
      onChange={onChange}
      className={cn("relative flex-shrink-0 text-left", className)}
      onKeyDown={handleKeyDown}
      disabled={disabled}
    >
      <>
        {customButton ? (
          <Listbox.Button as={React.Fragment}>
            <button
              ref={setReferenceElement}
              type="button"
              className={`flex items-center justify-between gap-1 text-xs ${
                disabled ? "cursor-not-allowed text-custom-text-200" : "cursor-pointer hover:bg-custom-background-80"
              } ${customButtonClassName}`}
              onClick={toggleDropdown}
            >
              {customButton}
            </button>
          </Listbox.Button>
        ) : (
          <Listbox.Button as={React.Fragment}>
            <button
              ref={setReferenceElement}
              type="button"
              className={cn(
                "flex w-full items-center justify-between gap-1 rounded border-[0.5px] border-custom-border-300",
                {
                  "px-3 py-2 text-sm": input,
                  "px-2 py-1 text-xs": !input,
                  "cursor-not-allowed text-custom-text-200": disabled,
                  "cursor-pointer hover:bg-custom-background-80": !disabled,
                },
                buttonClassName
              )}
              onClick={toggleDropdown}
            >
              {label}
              {!noChevron && !disabled && <ChevronDown className="h-3 w-3" aria-hidden="true" />}
            </button>
          </Listbox.Button>
        )}
      </>
      {isOpen && (
        <Listbox.Options className="fixed z-20" onClick={() => closeDropdown()} static>
          <div
            className={cn(
              "my-1 overflow-y-scroll rounded-md border-[0.5px] border-custom-border-300 bg-custom-background-100 px-2 py-2.5 text-xs shadow-custom-shadow-rg focus:outline-none min-w-[12rem] whitespace-nowrap",
              {
                "max-h-60": maxHeight === "lg",
                "max-h-48": maxHeight === "md",
                "max-h-36": maxHeight === "rg",
                "max-h-28": maxHeight === "sm",
              },
              optionsClassName
            )}
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
          >
            {children}
          </div>
        </Listbox.Options>
      )}
    </Listbox>
  );
};

const Option = (props: ICustomSelectItemProps) => {
  const { children, value, className } = props;
  return (
    <Listbox.Option
      value={value}
      className={({ active }) =>
        cn(
          "cursor-pointer select-none truncate rounded px-1 py-1.5 text-custom-text-200 flex items-center justify-between gap-2",
          {
            "bg-custom-background-80": active,
          },
          className
        )
      }
    >
      {({ selected }) => (
        <>
          {children}
          {selected && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
        </>
      )}
    </Listbox.Option>
  );
};

CustomSelect.Option = Option;

export { CustomSelect };
