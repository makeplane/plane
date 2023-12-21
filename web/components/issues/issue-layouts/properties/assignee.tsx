import { Fragment, useState } from "react";
import { observer } from "mobx-react-lite";
import { usePopper } from "react-popper";
import { Combobox } from "@headlessui/react";
import { Check, ChevronDown, CircleUser, Search } from "lucide-react";
// hooks
import { useApplication, useMember } from "hooks/store";
// ui
import { Avatar, AvatarGroup, Tooltip } from "@plane/ui";
// types
import { Placement } from "@popperjs/core";

export interface IIssuePropertyAssignee {
  projectId: string | null;
  value: string[] | string;
  onChange: (data: string[]) => void;
  disabled?: boolean;
  hideDropdownArrow?: boolean;
  className?: string;
  buttonClassName?: string;
  optionsClassName?: string;
  placement?: Placement;
  multiple?: true;
  noLabelBorder?: boolean;
}

export const IssuePropertyAssignee: React.FC<IIssuePropertyAssignee> = observer((props) => {
  const {
    projectId,
    value,
    onChange,
    disabled = false,
    hideDropdownArrow = false,
    className,
    buttonClassName,
    optionsClassName,
    placement,
    multiple = false,
  } = props;
  // store hooks
  const {
    router: { workspaceSlug },
  } = useApplication();
  const {
    project: { fetchProjectMembers, projectMemberIds, getProjectMemberDetails },
  } = useMember();
  // states
  const [query, setQuery] = useState("");
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState<Boolean>(false);

  const getWorkspaceMembers = () => {
    setIsLoading(true);
    if (workspaceSlug && projectId) fetchProjectMembers(workspaceSlug, projectId).then(() => setIsLoading(false));
  };

  const options = (projectMemberIds ?? [])?.map((memberId) => {
    const memberDetails = getProjectMemberDetails(memberId);

    return {
      value: `${memberDetails?.member.id}`,
      query: `${memberDetails?.member.display_name}`,
      content: (
        <div className="flex items-center gap-2">
          <Avatar name={memberDetails?.member.display_name} src={memberDetails?.member.avatar} showTooltip={false} />
          {memberDetails?.member.display_name}
        </div>
      ),
    };
  });

  const filteredOptions =
    query === "" ? options : options?.filter((option) => option.query.toLowerCase().includes(query.toLowerCase()));

  const getTooltipContent = (): string => {
    if (!value || value.length === 0) return "No Assignee";

    // if multiple assignees
    if (Array.isArray(value)) {
      const assignees = projectMemberIds?.filter((m) => value.includes(m));

      if (!assignees || assignees.length === 0) return "No Assignee";

      // if only one assignee in list
      if (assignees.length === 1) {
        return "1 assignee";
      } else return `${assignees.length} assignees`;
    }

    // if single assignee
    const assignee = getProjectMemberDetails(value);

    if (!assignee) return "No Assignee";

    // if assignee not null & not list
    return "1 assignee";
  };

  const label = (
    <Tooltip tooltipHeading="Assignee" tooltipContent={getTooltipContent()} position="top">
      <div className="flex h-full w-full items-center gap-2 text-custom-text-200">
        {value && value.length > 0 && Array.isArray(value) ? (
          <AvatarGroup showTooltip={false}>
            {value.map((assigneeId) => {
              const member = getProjectMemberDetails(assigneeId);
              if (!member) return null;
              return <Avatar key={member.id} name={member.member.display_name} src={member.member.avatar} />;
            })}
          </AvatarGroup>
        ) : (
          <span className="h-5 w-5 grid place-items-center">
            <CircleUser className="h-4 w-4" strokeWidth={1.5} />
          </span>
        )}
      </div>
    </Tooltip>
  );

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

  const comboboxProps: any = { value, onChange, disabled };
  if (multiple) comboboxProps.multiple = true;

  return (
    <Combobox as="div" className={`flex-shrink-0 text-left ${className}`} {...comboboxProps}>
      <Combobox.Button as={Fragment}>
        <button
          ref={setReferenceElement}
          type="button"
          className={`flex w-full items-center justify-between gap-1 text-xs ${
            disabled ? "cursor-not-allowed text-custom-text-200" : "cursor-pointer"
          } ${buttonClassName}`}
          onClick={() => !projectMemberIds && getWorkspaceMembers()}
        >
          {label}
          {!hideDropdownArrow && !disabled && <ChevronDown className="h-3 w-3" aria-hidden="true" />}
        </button>
      </Combobox.Button>
      <Combobox.Options className="fixed z-10">
        <div
          className={`my-1 w-48 whitespace-nowrap rounded border border-custom-border-300 bg-custom-background-100 px-2 py-2.5 text-xs shadow-custom-shadow-rg focus:outline-none ${optionsClassName}`}
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
            {isLoading ? (
              <p className="text-center text-custom-text-200">Loading...</p>
            ) : filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <Combobox.Option
                  key={option.value}
                  value={option.value}
                  className={({ active, selected }) =>
                    `flex cursor-pointer select-none items-center justify-between gap-2 truncate rounded px-1 py-1.5 ${
                      active && !selected ? "bg-custom-background-80" : ""
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
            )}
          </div>
        </div>
      </Combobox.Options>
    </Combobox>
  );
});
