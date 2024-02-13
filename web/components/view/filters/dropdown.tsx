import { FC, Fragment, ReactNode, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { Combobox } from "@headlessui/react";
import { usePopper } from "react-popper";
import { Placement } from "@popperjs/core";
import { ListFilter, Search } from "lucide-react";
// hooks
import useOutsideClickDetector from "hooks/use-outside-click-detector";
// components
import { ViewFiltersRoot } from "../";
// ui
import { Tooltip } from "@plane/ui";
// types
import { TViewTypes } from "@plane/types";
import { EViewPageType } from "constants/view";

type TViewFiltersDropdown = {
  workspaceSlug: string;
  projectId: string | undefined;
  viewId: string;
  viewType: TViewTypes;
  viewPageType: EViewPageType;
  children?: ReactNode;
  displayDropdownText?: boolean;
  dropdownPlacement?: Placement;
};

export const ViewFiltersDropdown: FC<TViewFiltersDropdown> = observer((props) => {
  const {
    workspaceSlug,
    projectId,
    viewId,
    viewType,
    viewPageType,
    children,
    displayDropdownText = true,
    dropdownPlacement = "bottom-start",
  } = props;
  // state
  const [dropdownToggle, setDropdownToggle] = useState(false);
  const [query, setQuery] = useState("");
  const [dateCustomFilterToggle, setDateCustomFilterToggle] = useState<string | undefined>(undefined);
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

  useOutsideClickDetector(dropdownRef, () => dateCustomFilterToggle === undefined && handleDropdownClose());

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
            <span className="relative inline-block">{children}</span>
          ) : (
            <Tooltip tooltipContent={"Filters"} position="bottom">
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
                  <ListFilter size={14} />
                </div>
                {displayDropdownText && <div className="text-sm whitespace-nowrap">Filters</div>}
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
            <div className="relative p-0.5 px-2 text-sm flex items-center gap-2 rounded border border-custom-border-100 bg-custom-background-90">
              <Search className="h-3 w-3 text-custom-text-300" strokeWidth={1.5} />
              <Combobox.Input
                className="w-full bg-transparent py-1 text-custom-text-200 placeholder:text-custom-text-400 focus:outline-none"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for a view..."
                displayValue={(assigned: any) => assigned?.name}
                autoFocus
              />
            </div>

            <div className="max-h-[500px] space-y-0.5 overflow-y-scroll mb-2">
              <ViewFiltersRoot
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                viewId={viewId}
                viewType={viewType}
                viewPageType={viewPageType}
                dateCustomFilterToggle={dateCustomFilterToggle}
                setDateCustomFilterToggle={setDateCustomFilterToggle}
              />
            </div>
          </div>
        </Combobox.Options>
      )}
    </Combobox>
  );
});
