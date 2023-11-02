import React, { useState } from "react";
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// popper js
import { usePopper } from "react-popper";
// ui
import { Combobox } from "@headlessui/react";
// icons
import { DiceIcon } from "@plane/ui";
// icons
import { Check, Search } from "lucide-react";

export interface IssueModuleSelectProps {
  workspaceSlug: string;
  projectId: string;
  value: string | null;
  onChange: (value: string) => void;
}

export const IssueModuleSelect: React.FC<IssueModuleSelectProps> = observer((props) => {
  const { workspaceSlug, projectId, value, onChange } = props;
  const [query, setQuery] = useState("");

  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "bottom-start",
  });

  const { module: moduleStore } = useMobxStore();

  const fetchModules = () => {
    if (workspaceSlug && projectId) moduleStore.fetchModules(workspaceSlug, projectId);
  };

  const modules = projectId ? moduleStore.modules[projectId] : undefined;

  const selectedModule = modules ? modules?.find((i) => i.id === value) : undefined;

  const options = modules?.map((module) => ({
    value: module.id,
    query: module.name,
    content: (
      <div className="flex items-center gap-1.5 truncate">
        <span className="flex justify-center items-center flex-shrink-0 w-3.5 h-3.5">
          <DiceIcon />
        </span>
        <span className="truncate flex-grow">{module.name}</span>
      </div>
    ),
  }));

  const filteredOptions =
    query === "" ? options : options?.filter((option) => option.query.toLowerCase().includes(query.toLowerCase()));

  const label = selectedModule ? (
    <div className="flex items-center gap-1.5">
      <span className="flex justify-center items-center flex-shrink-0 w-3.5 h-3.5">
        <DiceIcon />
      </span>
      <div className="truncate">{selectedModule.name}</div>
    </div>
  ) : (
    <>
      <DiceIcon className="h-3 w-3" />
      <span>Select Module</span>
    </>
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
          className={`flex items-center justify-between gap-1 w-full text-xs px-2 py-1 rounded-md shadow-sm  text-custom-text-200 border border-custom-border-300 duration-300 focus:outline-none ${
            false ? "cursor-not-allowed text-custom-text-200" : "cursor-pointer hover:bg-custom-background-80"
          }`}
          onClick={fetchModules}
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
                filteredOptions.map((option) => (
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
                ))
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
