import React, { Fragment, useRef, useState } from "react";
import { usePopper } from "react-popper";
import { Popover } from "@headlessui/react";
import { Placement } from "@popperjs/core";
// hooks
import { useDropdownKeyDown } from "hooks/use-dropdown-key-down";
import useOutsideClickDetector from "hooks/use-outside-click-detector";
// ui
import { Button } from "@plane/ui";
// icons
import { ChevronUp } from "lucide-react";

type Props = {
  children: React.ReactNode;
  title?: string;
  placement?: Placement;
  disabled?: boolean;
  tabIndex?: number;
};

export const FiltersDropdown: React.FC<Props> = (props) => {
  const { children, title = "Dropdown", placement, disabled = false, tabIndex } = props;

  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  // refs
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: placement ?? "auto",
  });

  const openDropdown = () => {
    setIsOpen(true);
    if (referenceElement) referenceElement.focus();
  };
  const closeDropdown = () => setIsOpen(false);
  const handleKeyDown = useDropdownKeyDown(openDropdown, closeDropdown, isOpen);
  useOutsideClickDetector(dropdownRef, closeDropdown);

  return (
    <Popover as="div" ref={dropdownRef} tabIndex={tabIndex} onKeyDown={handleKeyDown}>
      {({ open }) => {
        if (open) {
        }
        return (
          <>
            <Popover.Button as={React.Fragment}>
              <Button
                disabled={disabled}
                ref={setReferenceElement}
                variant="neutral-primary"
                size="sm"
                appendIcon={
                  <ChevronUp className={`transition-all ${open ? "" : "rotate-180"}`} size={14} strokeWidth={2} />
                }
                onClick={openDropdown}
              >
                <div className={`${open ? "text-custom-text-100" : "text-custom-text-200"}`}>
                  <span>{title}</span>
                </div>
              </Button>
            </Popover.Button>
            {isOpen && (
              <Popover.Panel static>
                <div
                  className="z-10 overflow-hidden rounded border border-custom-border-200 bg-custom-background-100 shadow-custom-shadow-rg"
                  ref={setPopperElement}
                  style={styles.popper}
                  {...attributes.popper}
                >
                  <div className="flex max-h-[37.5rem] w-[18.75rem] flex-col overflow-hidden">{children}</div>
                </div>
              </Popover.Panel>
            )}
          </>
        );
      }}
    </Popover>
  );
};
