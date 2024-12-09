import React, { useRef, useState } from "react";
import { Placement } from "@popperjs/core";
import { observer } from "mobx-react";
import { usePopper } from "react-popper";
import { Popover } from "@headlessui/react";
import { useOutsideClickDetector } from "@plane/hooks";
// types
import { TLogoProps } from "@plane/types";
// helpers
import { cn } from "@/helpers/common.helper";
// local components
import { IssueTypeLogo, TIssueTypeLogoSize } from "./issue-type-logo";
import { LucideIconsList } from "./lucide-icons-list";

export type TIssueTypeIconPicker = {
  isOpen: boolean;
  handleToggle: (value: boolean) => void;
  iconContainerClassName?: string;
  className?: string;
  closeOnSelect?: boolean;
  disabled?: boolean;
  dropdownClassName?: string;
  icon_props: TLogoProps["icon"];
  isDefaultIssueType?: boolean;
  onChange: (value: TLogoProps["icon"]) => void;
  placement?: Placement;
  size?: TIssueTypeLogoSize;
};

export const IssueTypeIconPicker: React.FC<TIssueTypeIconPicker> = observer((props) => {
  const {
    isOpen,
    handleToggle,
    iconContainerClassName,
    className,
    closeOnSelect = true,
    disabled = false,
    dropdownClassName,
    icon_props,
    isDefaultIssueType = false,
    onChange,
    size,
    placement = "bottom-start",
  } = props;
  // refs
  const containerRef = useRef<HTMLDivElement>(null);
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  // popper-js
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement,
    modifiers: [
      {
        name: "preventOverflow",
        options: {
          padding: 20,
        },
      },
    ],
  });

  // close dropdown on outside click
  useOutsideClickDetector(containerRef, () => handleToggle(false));

  return (
    <Popover as="div" className={cn("relative", className)}>
      <>
        <Popover.Button as={React.Fragment}>
          <button
            type="button"
            ref={setReferenceElement}
            className={cn("outline-none")}
            disabled={disabled}
            onClick={() => handleToggle(!isOpen)}
          >
            <IssueTypeLogo
              icon_props={icon_props}
              isDefault={isDefaultIssueType}
              size={size}
              containerClassName={iconContainerClassName}
            />
          </button>
        </Popover.Button>
        {isOpen && (
          <Popover.Panel className="fixed z-10" static>
            <div
              ref={setPopperElement}
              style={styles.popper}
              {...attributes.popper}
              className={cn(
                "w-72 mt-1 bg-custom-background-100 rounded-md border-[0.5px] border-custom-border-300 overflow-hidden",
                dropdownClassName
              )}
            >
              <div ref={containerRef} className="h-full w-full flex flex-col overflow-hidden">
                <div className="h-full w-full overflow-y-auto">
                  <div className="h-72 w-full relative overflow-hidden overflow-y-auto">
                    <LucideIconsList
                      defaultBackgroundColor={icon_props?.background_color}
                      onChange={(value, shouldClose) => {
                        onChange({ ...icon_props, ...value });
                        if (closeOnSelect && shouldClose) handleToggle(false);
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Popover.Panel>
        )}
      </>
    </Popover>
  );
});
