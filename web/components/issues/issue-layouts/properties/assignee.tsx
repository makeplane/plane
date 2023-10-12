import React from "react";
// headless ui
import { Combobox } from "@headlessui/react";
// lucide icons
import { ChevronDown, Search, X, Check } from "lucide-react";
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
  avatar: string;
}

export interface IIssuePropertyAssignee {
  value?: any;
  onChange?: (id: any, data: any) => void;
  disabled?: boolean;

  className?: string;
  buttonClassName?: string;
  optionsClassName?: string;
  dropdownArrow?: boolean;
}

export const IssuePropertyAssignee: React.FC<IIssuePropertyAssignee> = observer(
  ({
    value,
    onChange,
    disabled,

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

    const options: IFiltersOption[] | [] =
      (projectStore?.projectMembers &&
        projectStore?.projectMembers?.length > 0 &&
        projectStore?.projectMembers.map((_member: any) => ({
          id: _member?.member?.id,
          title: _member?.member?.display_name,
          avatar: _member?.member?.avatar && _member?.member?.avatar !== "" ? _member?.member?.avatar : null,
        }))) ||
      [];

    useDynamicDropdownPosition(isOpen, () => setIsOpen(false), dropdownBtn, dropdownOptions);

    const selectedOption: IFiltersOption[] =
      (value && value?.length > 0 && options.filter((_member: IFiltersOption) => value.includes(_member.id))) || [];

    const filteredOptions: IFiltersOption[] =
      search === ""
        ? options && options.length > 0
          ? options
          : []
        : options && options.length > 0
        ? options.filter((_member: IFiltersOption) =>
            _member.title.toLowerCase().replace(/\s+/g, "").includes(search.toLowerCase().replace(/\s+/g, ""))
          )
        : [];

    const assigneeRenderLength = 5;

    return (
      <Combobox
        multiple={true}
        as="div"
        className={`${className}`}
        value={selectedOption.map((_member: IFiltersOption) => _member.id) as string[]}
        onChange={(data: string[]) => {
          if (onChange && selectedOption) onChange(data, selectedOption);
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
                {selectedOption && selectedOption?.length > 0 ? (
                  <>
                    {selectedOption?.length > 1 ? (
                      <Tooltip
                        tooltipHeading={`Assignees`}
                        tooltipContent={(selectedOption.map((_label: IFiltersOption) => _label.title) || []).join(", ")}
                      >
                        <div className="flex-shrink-0 flex justify-center items-center gap-1 pr-[8px]">
                          {selectedOption.slice(0, assigneeRenderLength).map((_assignee) => (
                            <div
                              key={_assignee?.id}
                              className="flex-shrink-0 w-[16px] h-[16px] rounded-sm bg-gray-700 flex justify-center items-center text-white capitalize relative -mr-[8px] text-xs overflow-hidden border border-custom-border-300"
                            >
                              {_assignee && _assignee.avatar ? (
                                <img
                                  src={_assignee.avatar}
                                  className="absolute top-0 left-0 h-full w-full object-cover"
                                  alt={_assignee.title}
                                />
                              ) : (
                                _assignee.title[0]
                              )}
                            </div>
                          ))}
                          {selectedOption.length > assigneeRenderLength && (
                            <div className="flex-shrink-0 h-[16px] px-0.5 rounded-sm bg-gray-700 flex justify-center items-center text-white capitalize relative -mr-[8px] text-xs overflow-hidden border border-custom-border-300">
                              +{selectedOption?.length - assigneeRenderLength}
                            </div>
                          )}
                        </div>
                      </Tooltip>
                    ) : (
                      <Tooltip
                        tooltipHeading={`Assignees`}
                        tooltipContent={(selectedOption.map((_label: IFiltersOption) => _label.title) || []).join(", ")}
                      >
                        <div className="flex-shrink-0 flex justify-center items-center gap-1 text-xs">
                          <div className="flex-shrink-0 w-[14px] h-[14px] rounded-sm flex justify-center items-center text-white capitalize relative overflow-hidden text-xs">
                            {selectedOption[0] && selectedOption[0].avatar ? (
                              <img
                                src={selectedOption[0].avatar}
                                className="absolute top-0 left-0 h-full w-full object-cover"
                                alt={selectedOption[0].title}
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-700 flex justify-center items-center">
                                {selectedOption[0].title[0]}
                              </div>
                            )}
                          </div>
                          <div className="line-clamp-1">{selectedOption[0].title}</div>
                        </div>
                      </Tooltip>
                    )}
                  </>
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
                                key={option.id}
                                value={option.id}
                                className={({ active }) =>
                                  `cursor-pointer select-none truncate rounded px-1 py-1.5 ${
                                    active || (value && value.length > 0 && value.includes(option?.id))
                                      ? "bg-custom-background-80"
                                      : ""
                                  } ${
                                    value && value.length > 0 && value.includes(option?.id)
                                      ? "text-custom-text-100"
                                      : "text-custom-text-200"
                                  }`
                                }
                              >
                                <div className="flex items-center gap-1 w-full px-1">
                                  <div className="flex-shrink-0 w-[18px] h-[18px] rounded-sm flex justify-center items-center text-white capitalize relative overflow-hidden">
                                    {option && option.avatar ? (
                                      <img
                                        src={option.avatar}
                                        className="absolute top-0 left-0 h-full w-full object-cover"
                                        alt={option.title}
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-gray-700 flex justify-center items-center">
                                        {option.title[0]}
                                      </div>
                                    )}
                                  </div>
                                  <div className="line-clamp-1">{option.title}</div>
                                  {value && value.length > 0 && value.includes(option?.id) && (
                                    <div className="flex-shrink-0 ml-auto w-[13px] h-[13px] flex justify-center items-center">
                                      <Check width={13} strokeWidth={2} />
                                    </div>
                                  )}
                                </div>
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
