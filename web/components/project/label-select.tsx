import React, { useState } from "react";
import { usePopper } from "react-popper";
import { Placement } from "@popperjs/core";
import { Combobox } from "@headlessui/react";
import { Check, ChevronDown, PlusIcon, Search } from "lucide-react";
// ui
import { Tooltip } from "components/ui";
// types
import { IIssueLabels } from "types";

type Props = {
  value: string[];
  onChange: (data: string[]) => void;
  labels: IIssueLabels[] | undefined;
  className?: string;
  buttonClassName?: string;
  optionsClassName?: string;
  maxRender?: number;
  placement?: Placement;
  hideDropdownArrow?: boolean;
  disabled?: boolean;
};

export const LabelSelect: React.FC<Props> = ({
  value,
  onChange,
  labels,
  className = "",
  buttonClassName = "",
  optionsClassName = "",
  maxRender = 2,
  placement,
  hideDropdownArrow = false,
  disabled = false,
}) => {
  const [query, setQuery] = useState("");

  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);

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

  const options = labels?.map((label) => ({
    value: label.id,
    query: label.name,
    content: (
      <div className="flex items-center justify-start gap-2">
        <span
          className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
          style={{
            backgroundColor: label.color,
          }}
        />
        <span>{label.name}</span>
      </div>
    ),
  }));

  const filteredOptions =
    query === "" ? options : options?.filter((option) => option.query.toLowerCase().includes(query.toLowerCase()));

  return (
    <Combobox
      as="div"
      className={`flex-shrink-0 text-left ${className}`}
      value={value}
      onChange={onChange}
      disabled={disabled}
      multiple
    >
      <Combobox.Button as={React.Fragment}>
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
        >
          <div className="flex items-center gap-2 text-custom-text-200 h-full">
            {value.length > 0 ? (
              value.length <= maxRender ? (
                <>
                  {labels
                    ?.filter((l) => value.includes(l.id))
                    .map((label) => (
                      <div
                        key={label.id}
                        className="flex cursor-default items-center flex-shrink-0 rounded border-[0.5px] border-custom-border-300 px-2.5 py-1 text-xs h-full"
                      >
                        <div className="flex items-center gap-1.5 text-custom-text-200">
                          <span
                            className="h-2 w-2 flex-shrink-0 rounded-full"
                            style={{
                              backgroundColor: label?.color ?? "#000000",
                            }}
                          />
                          {label.name}
                        </div>
                      </div>
                    ))}
                </>
              ) : (
                <div className="h-full flex cursor-default items-center flex-shrink-0 rounded border-[0.5px] border-custom-border-300 px-2.5 py-1 text-xs">
                  <Tooltip
                    position="top"
                    tooltipHeading="Labels"
                    tooltipContent={labels
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
              <div className="h-full flex items-center justify-center text-xs rounded border-[0.5px] border-custom-border-300 px-2.5 py-1 hover:bg-custom-background-80">
                Select labels
              </div>
            )}
          </div>
          {!hideDropdownArrow && !disabled && <ChevronDown className="h-3 w-3" aria-hidden="true" />}
        </button>
      </Combobox.Button>

      <Combobox.Options>
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
            {filteredOptions ? (
              filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <Combobox.Option
                    key={option.value}
                    value={option.value}
                    className={({ active, selected }) =>
                      `flex items-center justify-between gap-2 cursor-pointer select-none truncate rounded px-1 py-1.5 ${
                        active ? "bg-custom-background-80" : ""
                      } ${selected ? "text-custom-text-100" : "text-custom-text-200"}`
                    }
                  >
                    {({ selected }) => (
                      <>
                        {option.content}
                        {selected && <Check className={`h-3.5 w-3.5`} />}
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
};
