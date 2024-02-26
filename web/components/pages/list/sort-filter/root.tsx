import { FC, Fragment, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { Menu, Transition } from "@headlessui/react";
import { usePopper } from "react-popper";
import { Copy, Eye, Globe2, Link2, Pencil, Trash } from "lucide-react";
// hooks
import { usePage } from "hooks/store";
// constants
import { pageSorting, pageSortingBy } from "constants/page";
// types
import { TPageFiltersSortKey } from "@plane/types";

type TViewEditDropdown = {
  projectId: string | undefined;
};

export const ViewEditDropdown: FC<TViewEditDropdown> = observer((props) => {
  const { projectId } = props;
  // hooks
  const { updateFilters } = usePage(projectId);
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

  const pageSortingByOptionKeys = Object.keys(pageSortingBy);

  return (
    <Menu as="div" className="relative flex-shrink-0" ref={dropdownRef}>
      <Menu.Button
        className="relative flex items-center gap-1 rounded px-2 h-8 transition-all hover:bg-custom-background-80 cursor-pointer outline-none"
        ref={setReferenceElement}
      >
        <div className="w-4 h-4 relative flex justify-center items-center overflow-hidden">
          <Pencil size={12} />
        </div>
      </Menu.Button>

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
          {pageSorting &&
            pageSorting.length > 0 &&
            pageSorting.map((option) => (
              <Menu.Item
                key={option.key}
                as="button"
                type="button"
                className="relative w-full flex items-center p-1 py-1.5 rounded transition-all hover:bg-custom-background-80 text-custom-text-200 hover:text-custom-text-100 cursor-pointer"
              >
                <div className="text-xs whitespace-nowrap">{option.label}</div>
              </Menu.Item>
            ))}
          <div />
          <div>Ascending/Descending</div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
});
