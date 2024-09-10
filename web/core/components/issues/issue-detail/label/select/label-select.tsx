import { Fragment, useState } from "react";
import { observer } from "mobx-react";
import { usePopper } from "react-popper";
import { Check, Search, Tag } from "lucide-react";
import { Combobox } from "@headlessui/react";
// helpers
import { getTabIndex } from "@/helpers/tab-indices.helper";
// hooks
import { useLabel } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";
// components

export interface IIssueLabelSelect {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  values: string[];
  onSelect: (_labelIds: string[]) => void;
}

export const IssueLabelSelect: React.FC<IIssueLabelSelect> = observer((props) => {
  const { workspaceSlug, projectId, issueId, values, onSelect } = props;
  // store hooks
  const { isMobile } = usePlatformOS();
  const { fetchProjectLabels, getProjectLabels } = useLabel();
  // states
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [query, setQuery] = useState("");

  const projectLabels = getProjectLabels(projectId);

  const { baseTabIndex } = getTabIndex(undefined, isMobile);

  const fetchLabels = () => {
    setIsLoading(true);
    if (!projectLabels && workspaceSlug && projectId)
      fetchProjectLabels(workspaceSlug, projectId).then(() => setIsLoading(false));
  };

  const options = (projectLabels ?? []).map((label) => ({
    value: label.id,
    query: label.name,
    content: (
      <div className="flex items-center justify-start gap-2 overflow-hidden">
        <span
          className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
          style={{
            backgroundColor: label.color,
          }}
        />
        <div className="line-clamp-1 inline-block truncate">{label.name}</div>
      </div>
    ),
  }));

  const filteredOptions =
    query === "" ? options : options?.filter((option) => option.query.toLowerCase().includes(query.toLowerCase()));

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "bottom-end",
    modifiers: [
      {
        name: "preventOverflow",
        options: {
          padding: 12,
        },
      },
    ],
  });

  const issueLabels = values ?? [];

  const label = (
    <div
      className={`relative flex flex-shrink-0 cursor-pointer items-center gap-1 rounded-full border border-custom-border-100 p-0.5 px-2 py-0.5 text-xs text-custom-text-300 transition-all hover:bg-custom-background-90 hover:text-custom-text-200`}
    >
      <div className="flex-shrink-0">
        <Tag className="h-2.5 w-2.5" />
      </div>
      <div className="flex-shrink-0">Select Label</div>
    </div>
  );

  const searchInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (query !== "" && e.key === "Escape") {
      e.stopPropagation();
      setQuery("");
    }
  };

  if (!issueId || !values) return <></>;

  return (
    <>
      <Combobox
        as="div"
        className={`w-auto max-w-full flex-shrink-0 text-left`}
        value={issueLabels}
        onChange={(value) => onSelect(value)}
        multiple
      >
        <Combobox.Button as={Fragment}>
          <button
            ref={setReferenceElement}
            type="button"
            className="cursor-pointer rounded"
            onClick={() => !projectLabels && fetchLabels()}
          >
            {label}
          </button>
        </Combobox.Button>

        <Combobox.Options className="fixed z-10">
          <div
            className={`z-10 my-1 w-48 whitespace-nowrap rounded border border-custom-border-300 bg-custom-background-100 py-2.5 text-xs shadow-custom-shadow-rg focus:outline-none`}
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
          >
            <div className="px-2">
              <div className="flex w-full items-center justify-start rounded border border-custom-border-200 bg-custom-background-90 px-2">
                <Search className="h-3.5 w-3.5 text-custom-text-300" />
                <Combobox.Input
                  className="w-full bg-transparent px-2 py-1 text-xs text-custom-text-200 placeholder:text-custom-text-400 focus:outline-none"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search"
                  displayValue={(assigned: any) => assigned?.name}
                  onKeyDown={searchInputKeyDown}
                  tabIndex={baseTabIndex}
                />
              </div>
            </div>
            <div className={`vertical-scrollbar scrollbar-sm mt-2 max-h-48 space-y-1 overflow-y-scroll px-2 pr-0`}>
              {isLoading ? (
                <p className="text-center text-custom-text-200">Loading...</p>
              ) : filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <Combobox.Option
                    key={option.value}
                    value={option.value}
                    className={({ selected }) =>
                      `flex cursor-pointer select-none items-center justify-between gap-2 truncate rounded px-1 py-1.5 hover:bg-custom-background-80 ${
                        selected ? "text-custom-text-100" : "text-custom-text-200"
                      }`
                    }
                  >
                    {({ selected }) => (
                      <>
                        {option.content}
                        {selected && (
                          <div className="flex-shrink-0">
                            <Check className={`h-3.5 w-3.5`} />
                          </div>
                        )}
                      </>
                    )}
                  </Combobox.Option>
                ))
              ) : (
                <span className="flex items-center gap-2 p-1">
                  <p className="text-left text-custom-text-200 ">No matching results</p>
                </span>
              )}
            </div>
          </div>
        </Combobox.Options>
      </Combobox>
    </>
  );
});
