import { FC, Fragment, ReactNode, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { Combobox } from "@headlessui/react";
import { usePopper } from "react-popper";
import { Placement } from "@popperjs/core";
import { MonitorDot } from "lucide-react";
// hooks
import useOutsideClickDetector from "hooks/use-outside-click-detector";
// components
import { ViewDisplayPropertiesRoot } from "../";
// ui
import { Tooltip } from "@plane/ui";
// types
import { TViewOperations } from "../types";
import { TViewTypes } from "@plane/types";

type TViewDisplayFiltersDropdown = {
  workspaceSlug: string;
  projectId: string | undefined;
  viewId: string;
  viewType: TViewTypes;
  viewOperations: TViewOperations;
  children?: ReactNode;
  displayDropdownText?: boolean;
  dropdownPlacement?: Placement;
};

export const ViewDisplayFiltersDropdown: FC<TViewDisplayFiltersDropdown> = observer((props) => {
  const {
    workspaceSlug,
    projectId,
    viewId,
    viewType,
    viewOperations,
    children,
    displayDropdownText = true,
    dropdownPlacement = "bottom-start",
  } = props;
  // state
  const [dropdownToggle, setDropdownToggle] = useState(false);
  // refs
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  // popper-js refs
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  // popper-js init
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: dropdownPlacement,
    modifiers: [
      {
        name: "preventOverflow",
        options: {
          padding: 12,
        },
      },
      {
        name: "offset",
        options: {
          offset: [0, 10],
        },
      },
    ],
  });

  const handleDropdownOpen = () => setDropdownToggle(true);
  const handleDropdownClose = () => setDropdownToggle(false);
  const handleDropdownToggle = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!dropdownToggle) handleDropdownOpen();
    else handleDropdownClose();
  };

  useOutsideClickDetector(dropdownRef, handleDropdownClose);

  return (
    <Combobox as="div" ref={dropdownRef}>
      <Combobox.Button as={Fragment}>
        <button
          ref={setReferenceElement}
          type="button"
          className={"block h-full w-full outline-none"}
          onClick={handleDropdownToggle}
        >
          {children ? (
            <div className="relative inline-block">{children}</div>
          ) : (
            <Tooltip tooltipContent={"Display"} position="bottom">
              <div
                className={`relative flex items-center gap-1 h-8 rounded px-2 transition-all
                ${
                  displayDropdownText
                    ? `border border-custom-border-300 text-custom-text-200 hover:text-custom-text-100 hover:bg-custom-background-80`
                    : `hover:bg-custom-background-80`
                }
              `}
              >
                <div className="w-4 h-4 relative flex justify-center items-center overflow-hidden">
                  <MonitorDot size={14} />
                </div>
                {displayDropdownText && <div className="text-sm whitespace-nowrap">Display</div>}
              </div>
            </Tooltip>
          )}
        </button>
      </Combobox.Button>

      {dropdownToggle && (
        <Combobox.Options className="fixed z-10" static>
          <div
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
            className="my-1 w-72 p-2 space-y-2 rounded bg-custom-background-100 border-[0.5px] border-custom-border-300 shadow-custom-shadow-rg focus:outline-none"
          >
            <div className="max-h-96 space-y-1 overflow-y-scroll">
              <div className="space-y-2">
                <div className="text-sm font-medium text-custom-text-200">Properties</div>
                <ViewDisplayPropertiesRoot
                  workspaceSlug={workspaceSlug}
                  projectId={projectId}
                  viewId={viewId}
                  viewType={viewType}
                  viewOperations={viewOperations}
                />
              </div>

              <div className="border border-red-500">Content</div>
            </div>
          </div>
        </Combobox.Options>
      )}
    </Combobox>
  );
});
