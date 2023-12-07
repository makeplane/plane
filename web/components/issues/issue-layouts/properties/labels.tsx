import { Fragment, useState } from "react";
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";
// hooks
import { usePopper } from "react-popper";
// components
import { Combobox } from "@headlessui/react";
import { Tooltip } from "@plane/ui";
import { Check, ChevronDown, Search } from "lucide-react";
// types
import { Placement } from "@popperjs/core";
import { RootStore } from "store/root";
import { IIssueLabel } from "types";

export interface IIssuePropertyLabels {
  projectId: string | null;
  value: string[];
  defaultOptions?: any;
  onChange: (data: string[]) => void;
  disabled?: boolean;
  hideDropdownArrow?: boolean;
  className?: string;
  buttonClassName?: string;
  optionsClassName?: string;
  placement?: Placement;
  maxRender?: number;
  noLabelBorder?: boolean;
}

export const IssuePropertyLabels: React.FC<IIssuePropertyLabels> = observer((props) => {
  const {
    projectId,
    value,
    defaultOptions = [],
    onChange,
    disabled,
    hideDropdownArrow = false,
    className,
    buttonClassName = "",
    optionsClassName = "",
    placement,
    maxRender = 2,
    noLabelBorder = false,
  } = props;

  const {
    workspace: workspaceStore,
    projectLabel: { fetchProjectLabels, labels },
  }: RootStore = useMobxStore();
  const workspaceSlug = workspaceStore?.workspaceSlug;

  const [query, setQuery] = useState("");

  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState<Boolean>(false);

  const fetchLabels = () => {
    setIsLoading(true);
    if (workspaceSlug && projectId) fetchProjectLabels(workspaceSlug, projectId).then(() => setIsLoading(false));
  };

  if (!value) return null;

  let projectLabels: IIssueLabel[] = defaultOptions;
  const storeLabels = projectId && labels ? labels[projectId] : [];
  if (storeLabels && storeLabels.length > 0) projectLabels = storeLabels;

  const options = projectLabels.map((label) => ({
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
        <div className="truncate inline-block line-clamp-1">{label.name}</div>
      </div>
    ),
  }));

  const filteredOptions =
    query === "" ? options : options?.filter((option) => option.query.toLowerCase().includes(query.toLowerCase()));

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

  const label = (
    <div className="overflow-hidden flex flex-wrap items-center h-5 gap-2 text-custom-text-200 w-full">
      {value.length > 0 ? (
        value.length <= maxRender ? (
          <>
            {projectLabels
              ?.filter((l) => value.includes(l.id))
              .map((label) => (
                <Tooltip position="top" tooltipHeading="Labels" tooltipContent={label.name ?? ""}>
                  <div
                    key={label.id}
                    className={`overflow-hidden flex hover:bg-custom-background-80 ${
                      !disabled && "cursor-pointer"
                    } items-center flex-shrink-0 rounded border-[0.5px] border-custom-border-300 px-2.5 py-1 text-xs h-full max-w-full`}
                  >
                    <div className="overflow-hidden flex items-center gap-1.5 text-custom-text-200 max-w-full">
                      <span
                        className="h-2 w-2 flex-shrink-0 rounded-full"
                        style={{
                          backgroundColor: label?.color ?? "#000000",
                        }}
                      />
                      <div className="truncate line-clamp-1 inline-block w-auto max-w-[100px]">{label.name}</div>
                    </div>
                  </div>
                </Tooltip>
              ))}
          </>
        ) : (
          <div className="h-full flex cursor-pointer items-center flex-shrink-0 rounded border-[0.5px] border-custom-border-300 px-2.5 py-1 text-xs">
            <Tooltip
              position="top"
              tooltipHeading="Labels"
              tooltipContent={projectLabels
                ?.filter((l) => value.includes(l.id))
                .map((l) => l.name)
                .join(", ")}
            >
              <div className="h-full flex items-center gap-1.5 text-custom-text-200">
                <span className="h-2 w-2 flex-shrink-0 rounded-full bg-custom-primary" />
                {`${value.length} Labels`}
              </div>
            </Tooltip>
          </div>
        )
      ) : (
        <div
          className={`h-full flex items-center justify-center text-xs rounded px-2.5 py-1 hover:bg-custom-background-80 ${
            noLabelBorder ? "" : "border-[0.5px] border-custom-border-300"
          }`}
        >
          Select labels
        </div>
      )}
    </div>
  );

  return (
    <Combobox
      as="div"
      className={`flex-shrink-0 text-left w-auto max-w-full ${className}`}
      value={value}
      onChange={onChange}
      disabled={disabled}
      multiple
    >
      <Combobox.Button as={Fragment}>
        <button
          ref={setReferenceElement}
          type="button"
          className={`flex items-center justify-between gap-1 w-full text-xs ${
            disabled
              ? "cursor-not-allowed text-custom-text-200"
              : value.length <= maxRender
              ? "cursor-pointer"
              : "cursor-pointer hover:bg-custom-background-80"
          }  ${buttonClassName}`}
          onClick={() => !storeLabels && fetchLabels()}
        >
          {label}
          {!hideDropdownArrow && !disabled && <ChevronDown className="h-3 w-3" aria-hidden="true" />}
        </button>
      </Combobox.Button>

      <Combobox.Options className="fixed z-10">
        <div
          className={`z-10 border border-custom-border-300 px-2 py-2.5 rounded bg-custom-background-100 text-xs shadow-custom-shadow-rg focus:outline-none w-48 whitespace-nowrap my-1 ${optionsClassName}`}
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
            {isLoading ? (
              <p className="text-center text-custom-text-200">Loading...</p>
            ) : filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <Combobox.Option
                  key={option.value}
                  value={option.value}
                  className={({ selected }) =>
                    `flex items-center justify-between gap-2 cursor-pointer select-none truncate rounded px-1 py-1.5 hover:bg-custom-background-80 ${
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
  );
});
