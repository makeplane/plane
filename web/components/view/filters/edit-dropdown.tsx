import { FC, Fragment, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import { observer } from "mobx-react-lite";
import { usePopper } from "react-popper";
import { Menu, Transition } from "@headlessui/react";
// hooks
import { useViewDetail } from "hooks/store";
// ui
import { PhotoFilterIcon } from "@plane/ui";
// types
import { TViewTypes } from "@plane/types";
import { TViewFilterEditDropdownOptions, TViewOperations } from "../types";

type TViewFiltersEditDropdown = {
  workspaceSlug: string;
  projectId: string | undefined;
  viewId: string;
  viewType: TViewTypes;
  viewOperations: TViewOperations;
};

export const ViewFiltersEditDropdown: FC<TViewFiltersEditDropdown> = observer((props) => {
  const { workspaceSlug, projectId, viewId, viewType, viewOperations } = props;
  // hooks
  const viewDetailStore = useViewDetail(workspaceSlug, projectId, viewId, viewType);
  // refs
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  // popper-js refs
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  // popper-js init
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "bottom-end",
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

  // dropdown options
  const dropdownOptions: TViewFilterEditDropdownOptions[] = useMemo(
    () => [
      {
        icon: PhotoFilterIcon,
        key: "save_as_new",
        label: "Save as new view",
        onClick: () => viewOperations.update(),
      },
      {
        icon: RotateCcw,
        key: "reset_changes",
        label: "Reset changes",
        onClick: () => viewOperations.resetChanges(),
      },
    ],
    [viewOperations]
  );

  if (!viewDetailStore?.isFiltersUpdateEnabled) return <></>;
  return (
    <Menu as="div" className="relative flex-shrink-0" ref={dropdownRef}>
      <div className=" relative flex items-center rounded h-8 transition-all cursor-pointer bg-custom-primary-100/20 text-custom-primary-100">
        <button
          className="text-sm px-3 font-medium h-full border-r border-white/50 flex justify-center items-center rounded-l transition-all hover:bg-custom-primary-100/30"
          disabled={viewDetailStore?.loader === "updating"}
          onClick={() => viewOperations.update()}
        >
          {viewDetailStore?.loader === "updating" ? "updating..." : "Update"}
        </button>
        <Menu.Button
          as="div"
          className="flex-shrink-0 px-1.5 hover:bg-custom-primary-100/30 h-full flex justify-center items-center rounded-r transition-all outline-none"
          ref={setReferenceElement}
        >
          {({ open }) => (!open ? <ChevronDown size={16} /> : <ChevronUp size={16} />)}
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items
          className="absolute right-0 z-20 mt-1.5 flex w-52 flex-col rounded border border-custom-sidebar-border-200 bg-custom-sidebar-background-100 text-xs shadow-lg outline-none p-1"
          ref={setPopperElement}
          style={styles.popper}
          {...attributes.popper}
        >
          {dropdownOptions &&
            dropdownOptions.length > 0 &&
            dropdownOptions.map((option) => (
              <Menu.Item
                key={option.key}
                as="button"
                type="button"
                className="relative flex items-center gap-2 p-1 py-1.5 rounded transition-all hover:bg-custom-background-80 text-custom-text-200 hover:text-custom-text-100 cursor-pointer"
                onClick={option.onClick}
              >
                <div className="flex-shrink-0 w-4 h-4 relative flex justify-center items-center">
                  <option.icon size={12} className="w-3 h-3" />
                </div>
                <div className="text-xs whitespace-nowrap">{option.label}</div>
              </Menu.Item>
            ))}
        </Menu.Items>
      </Transition>
    </Menu>
  );
});
