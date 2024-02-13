import { FC, Fragment, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { Menu, Transition } from "@headlessui/react";
import { usePopper } from "react-popper";
import { Copy, Eye, Globe2, Link2, Pencil, Trash } from "lucide-react";
// types
import { TViewEditDropdownOptions, TViewOperations } from "../types";

type TViewEditDropdown = {
  workspaceSlug: string;
  projectId: string | undefined;
  viewId: string;
  viewOperations: TViewOperations;
};

export const ViewEditDropdown: FC<TViewEditDropdown> = observer((props) => {
  const { viewId, viewOperations } = props;
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
  const dropdownOptions: TViewEditDropdownOptions[] = useMemo(
    () => [
      {
        icon: Pencil,
        key: "rename",
        label: "Rename",
        onClick: () => viewOperations.localViewCreateEdit(viewId),
        children: undefined,
      },
      {
        icon: Eye,
        key: "accessability",
        label: "Change Accessability",
        onClick: () => {},
        children: [
          {
            icon: Eye,
            key: "private",
            label: "Private",
            onClick: () => viewOperations.create({}),
            children: undefined,
          },
          {
            icon: Globe2,
            key: "public",
            label: "Public",
            onClick: () => viewOperations.create({}),
            children: undefined,
          },
        ],
      },
      {
        icon: Copy,
        key: "duplicate",
        label: "Duplicate view",
        onClick: () => viewOperations.remove(viewId),
        children: undefined,
      },
      {
        icon: Link2,
        key: "copy_link",
        label: "Copy view link",
        onClick: () => viewOperations.remove(viewId),
        children: undefined,
      },
      {
        icon: Trash,
        key: "delete",
        label: "Delete view",
        onClick: () => viewOperations.remove(viewId),
        children: undefined,
      },
    ],
    [viewOperations, viewId]
  );

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
          {dropdownOptions &&
            dropdownOptions.length > 0 &&
            dropdownOptions.map((option) => (
              <Menu.Item
                key={option.key}
                as="button"
                type="button"
                className="relative w-full flex items-center gap-2 p-1 py-1.5 rounded transition-all hover:bg-custom-background-80 text-custom-text-200 hover:text-custom-text-100 cursor-pointer"
                onClick={option.onClick}
              >
                <div className="flex-shrink-0 w-4 h-4 relative flex justify-center items-center">
                  <option.icon size={12} />
                </div>
                <div className="text-xs whitespace-nowrap">{option.label}</div>
              </Menu.Item>
            ))}
        </Menu.Items>
      </Transition>
    </Menu>
  );
});
