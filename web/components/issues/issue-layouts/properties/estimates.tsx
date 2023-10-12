import React from "react";
// headless ui
import { Combobox } from "@headlessui/react";
// lucide icons
import { ChevronDown, Search, X, Check, Triangle } from "lucide-react";
// mobx
import { observer } from "mobx-react-lite";
// components
import { Tooltip } from "@plane/ui";
// hooks
import useDynamicDropdownPosition from "hooks/use-dynamic-dropdown";
// mobx
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

interface IFiltersOption {
  id: string;
  title: string;
  key: string;
}

export interface IIssuePropertyEstimates {
  value?: any;
  onChange?: (id: any) => void;
  disabled?: boolean;

  workspaceSlug?: string;
  projectId?: string;

  className?: string;
  buttonClassName?: string;
  optionsClassName?: string;
  dropdownArrow?: boolean;
}

export const IssuePropertyEstimates: React.FC<IIssuePropertyEstimates> = observer(
  ({
    value,
    onChange,
    disabled,

    workspaceSlug,
    projectId,

    className,
    buttonClassName,
    optionsClassName,
    dropdownArrow = true,
  }) => {
    const { project: projectStore }: RootStore = useMobxStore();

    const dropdownBtn = React.useRef<any>(null);
    const dropdownOptions = React.useRef<any>(null);

    const [isOpen, setIsOpen] = React.useState<boolean>(false);
    const [search, setSearch] = React.useState<string>("");

    const projectDetail =
      (workspaceSlug && projectId && projectStore?.getProjectById(workspaceSlug, projectId)) || null;
    const projectEstimateId = (projectDetail && projectDetail?.estimate) || null;
    const estimates = (projectEstimateId && projectStore?.getProjectEstimateById(projectEstimateId)) || null;

    const options: IFiltersOption[] | [] =
      (estimates &&
        estimates.points &&
        estimates.points.length > 0 &&
        estimates.points.map((_estimate) => ({
          id: _estimate?.id,
          title: _estimate?.value,
          key: _estimate?.key.toString(),
        }))) ||
      [];

    useDynamicDropdownPosition(isOpen, () => setIsOpen(false), dropdownBtn, dropdownOptions);

    const selectedOption: IFiltersOption | null | undefined =
      (value && options.find((_estimate: IFiltersOption) => _estimate.key === value)) || null;

    const filteredOptions: IFiltersOption[] =
      search === ""
        ? options && options.length > 0
          ? options
          : []
        : options && options.length > 0
        ? options.filter((_estimate: IFiltersOption) =>
            _estimate.title.toLowerCase().replace(/\s+/g, "").includes(search.toLowerCase().replace(/\s+/g, ""))
          )
        : [];

    return (
      <Combobox
        as="div"
        className={`${className}`}
        value={selectedOption && selectedOption.key}
        onChange={(data: string) => {
          if (onChange) onChange(data);
        }}
        disabled={disabled}
      >
        {({ open }: { open: boolean }) => {
          if (open) {
            if (!isOpen) setIsOpen(true);
          } else if (isOpen) setIsOpen(false);

          return (
            <>
              <Combobox.Button
                ref={dropdownBtn}
                type="button"
                className={`flex items-center justify-between gap-1 px-1 py-0.5 rounded-sm shadow-sm border border-custom-border-300 duration-300 outline-none ${
                  disabled ? "cursor-not-allowed text-custom-text-200" : "cursor-pointer hover:bg-custom-background-80"
                } ${buttonClassName}`}
              >
                {selectedOption ? (
                  <Tooltip tooltipHeading={`Estimates`} tooltipContent={selectedOption?.title}>
                    <div className="flex-shrink-0 flex justify-center items-center gap-1">
                      <div className="flex-shrink-0 w-[12px] h-[12px] flex justify-center items-center">
                        <Triangle width={14} strokeWidth={2} />
                      </div>
                      <div className="pl-0.5 pr-1 text-xs">{selectedOption?.title}</div>
                    </div>
                  </Tooltip>
                ) : (
                  <div className="text-xs">Select option</div>
                )}

                {dropdownArrow && !disabled && (
                  <div className="flex-shrink-0 w-[14px] h-[14px] flex justify-center items-center">
                    <ChevronDown width={14} strokeWidth={2} />
                  </div>
                )}
              </Combobox.Button>

              <div className={`${open ? "fixed z-20 top-0 left-0 h-full w-full cursor-auto" : ""}`}>
                <Combobox.Options
                  ref={dropdownOptions}
                  className={`absolute z-10 border border-custom-border-300 p-2 rounded bg-custom-background-100 text-xs shadow-lg focus:outline-none whitespace-nowrap mt-1 space-y-1 ${optionsClassName}`}
                >
                  {options && options.length > 0 ? (
                    <>
                      <div className="flex w-full items-center justify-start rounded border border-custom-border-200 bg-custom-background-90 px-1">
                        <div className="flex-shrink-0 flex justify-center items-center w-[16px] h-[16px] rounded-sm">
                          <Search width={12} strokeWidth={2} />
                        </div>

                        <div>
                          <Combobox.Input
                            className="w-full bg-transparent p-1 text-xs text-custom-text-200 placeholder:text-custom-text-400 focus:outline-none"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search"
                            displayValue={(assigned: any) => assigned?.name}
                          />
                        </div>

                        {search && search.length > 0 && (
                          <div
                            onClick={() => setSearch("")}
                            className="flex-shrink-0 flex justify-center items-center w-[16px] h-[16px] rounded-sm cursor-pointer hover:bg-custom-background-80"
                          >
                            <X width={12} strokeWidth={2} />
                          </div>
                        )}
                      </div>

                      <div className={`space-y-0.5 max-h-48 overflow-y-scroll`}>
                        {filteredOptions ? (
                          filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => (
                              <Combobox.Option
                                key={option.key}
                                value={option.key}
                                className={({ active, selected }) =>
                                  `cursor-pointer select-none truncate rounded px-1 py-1.5 ${
                                    active || selected ? "bg-custom-background-80" : ""
                                  } ${selected ? "text-custom-text-100" : "text-custom-text-200"}`
                                }
                              >
                                {({ selected }) => (
                                  <div className="flex items-center gap-1 w-full px-1">
                                    <div className="flex-shrink-0 w-[13px] h-[13px] flex justify-center items-center">
                                      <Triangle width={14} strokeWidth={2} />
                                    </div>
                                    <div className="line-clamp-1">{option.title}</div>
                                    {selected && (
                                      <div className="flex-shrink-0 ml-auto w-[13px] h-[13px] flex justify-center items-center">
                                        <Check width={13} strokeWidth={2} />
                                      </div>
                                    )}
                                  </div>
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
                    </>
                  ) : (
                    <p className="text-center text-custom-text-200">No options available.</p>
                  )}
                </Combobox.Options>
              </div>
            </>
          );
        }}
      </Combobox>
    );
  }
);
