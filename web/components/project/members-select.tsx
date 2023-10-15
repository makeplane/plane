import React, { useState } from "react";

import { useRouter } from "next/router";

// react-popper
import { usePopper } from "react-popper";
// hooks
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
import { Placement } from "@popperjs/core";

type Props = {
  value: string | string[];
  projectId: string;
  onChange: (data: any) => void;
  membersDetails: IUser[];
  renderWorkspaceMembers?: boolean;
  className?: string;
  buttonClassName?: string;
  optionsClassName?: string;
  placement?: Placement;
  hideDropdownArrow?: boolean;
  disabled?: boolean;
};

export const MembersSelect: React.FC<Props> = ({
  value,
  projectId,
  onChange,
  membersDetails,
  renderWorkspaceMembers = false,
  className = "",
  buttonClassName = "",
  optionsClassName = "",
  placement,
  hideDropdownArrow = false,
  disabled = false,
}) => {
  const [query, setQuery] = useState("");
  const [fetchStates, setFetchStates] = useState(false);

  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: placement ?? "bottom-start",
  });

  const { members } = useProjectMembers(workspaceSlug?.toString(), projectId, fetchStates && !renderWorkspaceMembers);

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
    query === "" ? options : options?.filter((option) => option.query.toLowerCase().includes(query.toLowerCase()));

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
        if (open) setFetchStates(true);

        return (
          <>
            <Combobox.Button as={React.Fragment}>
              <button
                ref={setReferenceElement}
                type="button"
                className={`flex items-center justify-between gap-1 w-full text-xs ${
                  disabled ? "cursor-not-allowed text-custom-text-200" : "cursor-pointer hover:bg-custom-background-80"
                } ${buttonClassName}`}
              >
                {label}
                {!hideDropdownArrow && !disabled && <ChevronDownIcon className="h-3 w-3" aria-hidden="true" />}
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
              </div>
            </Combobox.Options>
          </>
        );
      }}
    </Combobox>
  );
};
