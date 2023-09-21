import React, { useRef, useState } from "react";

import { useRouter } from "next/router";

// hooks
import useDynamicDropdownPosition from "hooks/use-dynamic-dropdown";
import useProjectMembers from "hooks/use-project-members";
import useWorkspaceMembers from "hooks/use-workspace-members";
// headless ui
import { Combobox } from "@headlessui/react";
// components
import { AssigneesList, Avatar, Icon, Tooltip } from "components/ui";
// icons
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { CheckIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
// types
import { IUser } from "types";

type Props = {
  value: string | string[];
  onChange: (data: any) => void;
  membersDetails: IUser[];
  renderWorkspaceMembers?: boolean;
  className?: string;
  buttonClassName?: string;
  optionsClassName?: string;
  hideDropdownArrow?: boolean;
  disabled?: boolean;
};

export const MembersSelect: React.FC<Props> = ({
  value,
  onChange,
  membersDetails,
  renderWorkspaceMembers = false,
  className = "",
  buttonClassName = "",
  optionsClassName = "",
  hideDropdownArrow = false,
  disabled = false,
}) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [fetchStates, setFetchStates] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const dropdownBtn = useRef<any>(null);
  const dropdownOptions = useRef<any>(null);

  const { members } = useProjectMembers(
    workspaceSlug?.toString(),
    projectId?.toString(),
    fetchStates && !renderWorkspaceMembers
  );

  const { workspaceMembers } = useWorkspaceMembers(
    workspaceSlug?.toString() ?? "",
    fetchStates && renderWorkspaceMembers
  );

  const membersOptions = renderWorkspaceMembers ? workspaceMembers : members;

  const options = membersOptions?.map((member) => ({
    value: member.member.id,
    query: member.member.display_name,
    content: (
      <div className="flex items-center gap-2">
        <Avatar user={member.member} />
        {member.member.display_name}
      </div>
    ),
  }));

  const filteredOptions =
    query === ""
      ? options
      : options?.filter((option) => option.query.toLowerCase().includes(query.toLowerCase()));

  const label = (
    <Tooltip
      tooltipHeading="Assignee"
      tooltipContent={
        membersDetails && membersDetails.length > 0
          ? membersDetails.map((assignee) => assignee?.display_name).join(", ")
          : "No Assignee"
      }
      position="top"
    >
      <div className="flex items-center cursor-pointer w-full gap-2 text-custom-text-200">
        {value && value.length > 0 && Array.isArray(value) ? (
          <AssigneesList userIds={value} length={3} showLength={true} />
        ) : (
          <span
            className="flex items-center justify-between gap-1 w-full text-xs px-2.5 py-1 rounded-md shadow-sm border border-custom-border-300 duration-300 focus:outline-none
          "
          >
            <Icon iconName="person" className="text-sm !leading-4" />
          </span>
        )}
      </div>
    </Tooltip>
  );

  useDynamicDropdownPosition(isOpen, () => setIsOpen(false), dropdownBtn, dropdownOptions);

  return (
    <Combobox
      as="div"
      className={`flex-shrink-0 text-left ${className}`}
      value={value}
      onChange={onChange}
      disabled={disabled}
      multiple
    >
      {({ open }: { open: boolean }) => {
        if (open) {
          if (!isOpen) setIsOpen(true);
          setFetchStates(true);
        } else if (isOpen) setIsOpen(false);

        return (
          <>
            <Combobox.Button
              ref={dropdownBtn}
              type="button"
              className={`flex items-center justify-between gap-1 w-full text-xs ${
                disabled
                  ? "cursor-not-allowed text-custom-text-200"
                  : "cursor-pointer hover:bg-custom-background-80"
              } ${buttonClassName}`}
            >
              {label}
              {!hideDropdownArrow && !disabled && (
                <ChevronDownIcon className="h-3 w-3" aria-hidden="true" />
              )}
            </Combobox.Button>
            <div className={`${open ? "fixed z-20 top-0 left-0 h-full w-full cursor-auto" : ""}`}>
              <Combobox.Options
                ref={dropdownOptions}
                className={`absolute z-10 border border-custom-border-300 px-2 py-2.5 rounded bg-custom-background-100 text-xs shadow-lg focus:outline-none w-48 whitespace-nowrap mt-1 ${optionsClassName}`}
              >
                <div className="flex w-full items-center justify-start rounded border border-custom-border-200 bg-custom-background-90 px-2">
                  <MagnifyingGlassIcon className="h-3.5 w-3.5 text-custom-text-300" />
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
                            } ${selected ? "text-custom-text-100" : "text-custom-text-200"}`
                          }
                        >
                          {({ selected }) => (
                            <>
                              {option.content}
                              {selected && <CheckIcon className={`h-3.5 w-3.5`} />}
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
              </Combobox.Options>
            </div>
          </>
        );
      }}
    </Combobox>
  );
};
