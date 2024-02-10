import { FC, Fragment, ReactNode, useRef, useState } from "react";
import { Combobox } from "@headlessui/react";
import { usePopper } from "react-popper";
import { Placement } from "@popperjs/core";
import { Plus, Search } from "lucide-react";
// hooks
import useOutsideClickDetector from "hooks/use-outside-click-detector";
import { useView } from "hooks/store";
// components
import { ViewDropdownItem } from "..";
// types
import { TViewTypes } from "@plane/types";
import { TViewOperations } from "../types";

type TViewDropdown = {
  workspaceSlug: string;
  projectId: string | undefined;
  viewId: string;
  viewType: TViewTypes;
  viewOperations: TViewOperations;
  children?: ReactNode;
  baseRoute: string;
  dropdownPlacement?: Placement;
};

export const ViewDropdown: FC<TViewDropdown> = (props) => {
  const {
    workspaceSlug,
    projectId,
    viewId: currentViewId,
    viewType,
    viewOperations,
    children,
    baseRoute,
    dropdownPlacement = "bottom-start",
  } = props;
  // hooks
  const viewStore = useView(workspaceSlug, projectId, viewType);
  // states
  const [dropdownToggle, setDropdownToggle] = useState(false);
  const [query, setQuery] = useState("");
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
            <span className="relative inline-block">{children}</span>
          ) : (
            <span className="whitespace-nowrap">More...</span>
          )}
        </button>
      </Combobox.Button>

      {dropdownToggle && (
        <Combobox.Options className="fixed z-10" static>
          <div
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
            className="w-64 p-2 space-y-2 rounded bg-custom-background-100 border-[0.5px] border-custom-border-300 shadow-custom-shadow-rg focus:outline-none"
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

            <div className="max-h-60 space-y-0.5 overflow-y-scroll">
              {viewStore?.viewIds &&
                viewStore?.viewIds.length > 0 &&
                viewStore?.viewIds.map((viewId) => (
                  <Fragment key={viewId}>
                    <ViewDropdownItem
                      workspaceSlug={workspaceSlug}
                      projectId={projectId}
                      viewId={viewId}
                      viewType={viewType}
                      currentViewId={currentViewId}
                      searchQuery={query}
                      baseRoute={baseRoute}
                    />
                  </Fragment>
                ))}
            </div>

            <div
              className="relative flex justify-center items-center gap-1 rounded p-1 py-1.5 transition-all border border-custom-border-200 bg-custom-background-90 hover:bg-custom-background-80 text-custom-text-300 hover:text-custom-text-200 cursor-pointer"
              onClick={() => viewOperations?.localViewCreateEdit(undefined)}
            >
              <Plus className="w-3 h-3" />
              <div className="text-sm">New view</div>
            </div>
          </div>
        </Combobox.Options>
      )}
    </Combobox>
  );
};
