import React, { useState } from "react";
import { usePopper } from "react-popper";
import { Placement } from "@popperjs/core";
import { Combobox } from "@headlessui/react";
import { Check, ChevronDown, Search } from "lucide-react";
// ui
import { Tooltip } from "@plane/ui";
// types
import { IIssueLabel } from "types";

type Props = {
  value: string[];
  onChange: (data: string[]) => void;
  labels: IIssueLabel[] | undefined;
  className?: string;
  buttonClassName?: string;
  optionsClassName?: string;
  maxRender?: number;
  placement?: Placement;
  hideDropdownArrow?: boolean;
  disabled?: boolean;
};

export const LabelSelect: React.FC<Props> = (props) => {
  const {
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
  } = props;

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
        <button ref={setReferenceElement} type="button" className="h-full w-full">
          {value.length > 0 ? (
            value.length <= maxRender ? (
              <div className="flex items-center gap-2 overflow-x-scroll px-4">
                {labels
                  ?.filter((l) => value.includes(l.id))
                  .map((label) => (
                    <div
                      key={label.id}
                      className="flex h-full flex-shrink-0 items-center rounded border-[0.5px] border-custom-border-300 px-2.5 py-1 text-xs"
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
              </div>
            ) : (
              <div
                className={`flex h-full flex-shrink-0 items-center rounded border-[0.5px] border-custom-border-300 px-4 text-xs ${buttonClassName}`}
              >
                <Tooltip
                  position="top"
                  tooltipHeading="Labels"
                  tooltipContent={labels
                    ?.filter((l) => value.includes(l.id))
                    .map((l) => l.name)
                    .join(", ")}
                >
                  <div className="flex h-full items-center gap-1.5 text-custom-text-200">
                    <span className="h-2 w-2 flex-shrink-0 rounded-full bg-custom-primary" />
                    {`${value.length} Labels`}
                  </div>
                </Tooltip>
              </div>
            )
          ) : (
            <div
              className={`flex w-full items-center justify-between gap-1 px-4 text-xs ${
                disabled ? "cursor-not-allowed text-custom-text-200" : "cursor-pointer hover:bg-custom-background-80"
              }  ${buttonClassName}`}
            >
              Select labels
            </div>
          )}
          {!hideDropdownArrow && !disabled && <ChevronDown className="h-3 w-3" aria-hidden="true" />}
        </button>
      </Combobox.Button>

      <Combobox.Options>
        <div
          className={`z-10 my-1 w-48 whitespace-nowrap rounded border border-custom-border-300 bg-custom-background-100 px-2 py-2.5 text-xs shadow-custom-shadow-rg focus:outline-none ${optionsClassName}`}
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
