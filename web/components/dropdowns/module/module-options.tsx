import { useEffect, useRef, useState } from "react";
import { Placement } from "@popperjs/core";
import { observer } from "mobx-react";
import { usePopper } from "react-popper";
import { Check, Search } from "lucide-react";
import { Combobox } from "@headlessui/react";
//components
import { DiceIcon } from "@plane/ui";
//store
import { cn } from "@/helpers/common.helper";
import { useAppRouter, useModule } from "@/hooks/store";
//hooks
//icon
//types

type DropdownOptions =
  | {
      value: string | null;
      query: string;
      content: JSX.Element;
    }[]
  | undefined;

interface Props {
  projectId: string;
  referenceElement: HTMLButtonElement | null;
  placement: Placement | undefined;
  isOpen: boolean;
  multiple: boolean;
}

export const ModuleOptions = observer((props: Props) => {
  const { projectId, isOpen, referenceElement, placement, multiple } = props;
  // states
  const [query, setQuery] = useState("");
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  // refs
  const inputRef = useRef<HTMLInputElement | null>(null);
  // store hooks
  const { workspaceSlug } = useAppRouter();
  const { getProjectModuleIds, fetchModules, getModuleById } = useModule();

  useEffect(() => {
    if (isOpen) {
      onOpen();
      inputRef.current && inputRef.current.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

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

  const moduleIds = getProjectModuleIds(projectId);

  const onOpen = () => {
    if (workspaceSlug && !moduleIds) fetchModules(workspaceSlug, projectId);
  };

  const searchInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (query !== "" && e.key === "Escape") {
      e.stopPropagation();
      setQuery("");
    }
  };

  const options: DropdownOptions = moduleIds?.map((moduleId) => {
    const moduleDetails = getModuleById(moduleId);
    return {
      value: moduleId,
      query: `${moduleDetails?.name}`,
      content: (
        <div className="flex items-center gap-2">
          <DiceIcon className="h-3 w-3 flex-shrink-0" />
          <span className="flex-grow truncate">{moduleDetails?.name}</span>
        </div>
      ),
    };
  });
  if (!multiple)
    options?.unshift({
      value: null,
      query: "No module",
      content: (
        <div className="flex items-center gap-2">
          <DiceIcon className="h-3 w-3 flex-shrink-0" />
          <span className="flex-grow truncate">No module</span>
        </div>
      ),
    });

  const filteredOptions =
    query === "" ? options : options?.filter((o) => o.query.toLowerCase().includes(query.toLowerCase()));

  return (
    <Combobox.Options className="fixed z-10" static>
      <div
        className="my-1 w-48 rounded border-[0.5px] border-custom-border-300 bg-custom-background-100 px-2 py-2.5 text-xs shadow-custom-shadow-rg focus:outline-none"
        ref={setPopperElement}
        style={styles.popper}
        {...attributes.popper}
      >
        <div className="flex items-center gap-1.5 rounded border border-custom-border-100 bg-custom-background-90 px-2">
          <Search className="h-3.5 w-3.5 text-custom-text-400" strokeWidth={1.5} />
          <Combobox.Input
            as="input"
            ref={inputRef}
            className="w-full bg-transparent py-1 text-xs text-custom-text-200 placeholder:text-custom-text-400 focus:outline-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            displayValue={(assigned: any) => assigned?.name}
            onKeyDown={searchInputKeyDown}
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
                    cn(
                      "flex w-full cursor-pointer select-none items-center justify-between gap-2 truncate rounded px-1 py-1.5",
                      {
                        "bg-custom-background-80": active,
                        "text-custom-text-100": selected,
                        "text-custom-text-200": !selected,
                      }
                    )
                  }
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
              <p className="px-1.5 py-1 italic text-custom-text-400">No matching results</p>
            )
          ) : (
            <p className="px-1.5 py-1 italic text-custom-text-400">Loading...</p>
          )}
        </div>
      </div>
    </Combobox.Options>
  );
});
