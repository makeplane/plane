import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import { usePopper } from "react-popper";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// ui
import { Combobox } from "@headlessui/react";
// icons
import { ContrastIcon } from "@plane/ui";
// icons
import { Check, Search } from "lucide-react";

export interface IssueCycleSelectProps {
  workspaceSlug: string;
  projectId: string;
  value: string | null;
  onChange: (value: string) => void;
}

export const IssueCycleSelect: React.FC<IssueCycleSelectProps> = observer((props) => {
  const { workspaceSlug, projectId, value, onChange } = props;
  const [query, setQuery] = useState("");

  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "bottom-start",
  });

  const { cycle: cycleStore } = useMobxStore();

  const fetchCycles = () => {
    if (workspaceSlug && projectId) cycleStore.fetchCycles(workspaceSlug, projectId, "all");
  };

  const cycles = cycleStore.projectCycles;

  const selectedCycle = cycles ? cycles?.find((i) => i.id === value) : undefined;

  const options = cycles?.map((cycle) => ({
    value: cycle.id,
    query: cycle.name,
    content: (
      <div className="flex items-center gap-1.5 truncate">
        <span className="flex justify-center items-center flex-shrink-0 w-3.5 h-3.5">
          <ContrastIcon />
        </span>
        <span className="truncate flex-grow">{cycle.name}</span>
      </div>
    ),
  }));

  const filteredOptions =
    query === "" ? options : options?.filter((option) => option.query.toLowerCase().includes(query.toLowerCase()));

  const label = selectedCycle ? (
    <div className="flex items-center w-full gap-1 text-custom-text-200">
      <ContrastIcon className="h-3 w-3 flex-shrink-0" />
      <div className="truncate max-w-[160px]">{selectedCycle.name}</div>
    </div>
  ) : (
    <div className="flex items-center gap-1 text-custom-text-300">
      <ContrastIcon className="h-3 w-3" />
      <span>Cycle</span>
    </div>
  );

  return (
    <Combobox
      as="div"
      className={`flex-shrink-0 text-left`}
      value={value}
      onChange={(val: string) => onChange(val)}
      disabled={false}
    >
      <Combobox.Button as={React.Fragment}>
        <button
          ref={setReferenceElement}
          type="button"
          className="flex items-center justify-between gap-1 w-full cursor-pointer rounded border-[0.5px] border-custom-border-300 text-custom-text-200 px-2 py-1 text-xs hover:bg-custom-background-80"
          onClick={fetchCycles}
        >
          {label}
        </button>
      </Combobox.Button>
      <Combobox.Options>
        <div
          className={`z-10 border border-custom-border-300 px-2 py-2.5 rounded bg-custom-background-100 text-xs shadow-custom-shadow-rg focus:outline-none w-48 whitespace-nowrap my-1`}
          ref={setPopperElement}
          style={styles.popper}
          {...attributes.popper}
        >
          <div className="flex w-full items-center justify-start rounded border border-custom-border-200 bg-custom-background-90 px-2">
            <Search className="h-3.5 w-3.5 text-custom-text-300" />
            <Combobox.Input
              className="w-full bg-transparent py-1 px-2 text-xs text-custom-text-200 placeholder:text-custom-text-400 focus:outline-none"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              displayValue={(assigned: any) => assigned?.name}
            />
          </div>
          <div className={`mt-2 space-y-1 max-h-48 overflow-y-scroll`}>
            {filteredOptions ? (
              filteredOptions.length > 0 ? (
                <>
                  {filteredOptions.map((option) => (
                    <Combobox.Option
                      key={option.value}
                      value={option.value}
                      className={({ active, selected }) =>
                        `flex items-center justify-between gap-2 cursor-pointer select-none truncate rounded px-1 py-1.5 ${
                          active && !selected ? "bg-custom-background-80" : ""
                        } w-full truncate ${selected ? "text-custom-text-100" : "text-custom-text-200"}`
                      }
                    >
                      {({ selected }) => (
                        <>
                          {option.content}
                          {selected && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
                        </>
                      )}
                    </Combobox.Option>
                  ))}
                  <Combobox.Option
                    key="none"
                    value=""
                    className={({ active }) =>
                      `flex items-center justify-between gap-2 ${
                        active ? "bg-custom-background-80" : ""
                      }  cursor-pointer select-none truncate rounded px-1 py-1.5 w-full text-custom-text-100`
                    }
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="truncate flex-grow">None</span>
                    </div>
                  </Combobox.Option>
                </>
              ) : (
                <span className="flex items-center gap-2 p-1">
                  <p className="text-left text-custom-text-200 ">No matching results</p>
                </span>
              )
            ) : (
              <p className="text-center text-custom-text-200">Loading...</p>
            )}
          </div>
        </div>
      </Combobox.Options>
    </Combobox>
  );
});
