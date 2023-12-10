import React, { useState } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import type { FieldError } from "react-hook-form";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// popper js
import { usePopper } from "react-popper";
// ui
import { Combobox } from "@headlessui/react";
// helpers
import { renderEmoji } from "helpers/emoji.helper";
// icons
import { Check, Clipboard, Search } from "lucide-react";

export interface IssueProjectSelectProps {
  value: string;
  onChange: (value: string) => void;
  error?: FieldError;
}

export const IssueProjectSelect: React.FC<IssueProjectSelectProps> = observer((props) => {
  const { value, onChange } = props;
  const [query, setQuery] = useState("");

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "bottom-start",
  });

  const { project: projectStore } = useMobxStore();

  const projects = workspaceSlug ? projectStore.projects[workspaceSlug.toString()] : undefined;

  const selectedProject = projects?.find((i) => i.id === value);

  const options = projects?.map((project) => ({
    value: project.id,
    query: project.name,
    content: (
      <div className="flex items-center gap-1.5 truncate">
        <span className="grid flex-shrink-0 place-items-center">
          {project.emoji ? renderEmoji(project.emoji) : project.icon_prop ? renderEmoji(project.icon_prop) : null}
        </span>
        <span className="flex-grow truncate">{project.name}</span>
      </div>
    ),
  }));

  const filteredOptions =
    query === "" ? options : options?.filter((option) => option.query.toLowerCase().includes(query.toLowerCase()));

  const label = selectedProject ? (
    <div className="flex items-center gap-1.5">
      <span className="flex h-3 w-3 items-center">
        {selectedProject.emoji
          ? renderEmoji(selectedProject.emoji)
          : selectedProject.icon_prop
            ? renderEmoji(selectedProject.icon_prop)
            : null}
      </span>
      <div className="truncate">{selectedProject.identifier}</div>
    </div>
  ) : (
    <>
      <Clipboard className="h-3 w-3" />
      <span>Select Project</span>
    </>
  );
  return (
    <Combobox as="div" className="flex-shrink-0 text-left" value={value} onChange={(val: string) => onChange(val)}>
      <Combobox.Button as={React.Fragment}>
        <button
          ref={setReferenceElement}
          type="button"
          className="flex w-full items-center justify-center gap-1 rounded border-[0.5px] border-custom-border-300 px-2 py-1  text-xs text-custom-text-300   hover:bg-custom-background-80"
        >
          {label}
        </button>
      </Combobox.Button>
      <Combobox.Options>
        <div
          className={`z-10 my-1 w-48 whitespace-nowrap rounded border border-custom-border-300 bg-custom-background-100 px-2 py-2.5 text-xs shadow-custom-shadow-rg focus:outline-none`}
          ref={setPopperElement}
          style={styles.popper}
          {...attributes.popper}
        >
          <div className="flex w-full items-center justify-start rounded border border-custom-border-200 bg-custom-background-90 px-2">
            <Search className="h-3.5 w-3.5 text-custom-text-300" />
            <Combobox.Input
              className="w-full bg-transparent px-2 py-1 text-xs text-custom-text-200 placeholder:text-custom-text-400 focus:outline-none"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              displayValue={(assigned: any) => assigned?.name}
            />
          </div>
          <div className={`mt-2 max-h-48 space-y-1 overflow-y-scroll`}>
            {filteredOptions ? (
              filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <Combobox.Option
                    key={option.value}
                    value={option.value}
                    className={({ active, selected }) =>
                      `flex cursor-pointer select-none items-center justify-between gap-2 truncate rounded px-1 py-1.5 ${
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
