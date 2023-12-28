import React, { FC, useState, Fragment } from "react";
// popper js
import { usePopper } from "react-popper";
// ui
import { Avatar, Input } from "@plane/ui";
import { Listbox } from "@headlessui/react";
// icons
import { Check, Search, User2 } from "lucide-react";
// types
import { IWorkspaceMember } from "@plane/types";
import { useMember } from "hooks/store";

export interface IWorkspaceMemberSelect {
  value: IWorkspaceMember | undefined;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
}

export const WorkspaceMemberSelect: FC<IWorkspaceMemberSelect> = (props) => {
  const { value, onChange, options, placeholder = "Select Member", disabled = false } = props;
  // states
  const [query, setQuery] = useState("");

  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  // popper js
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "auto",
  });
  const {
    workspace: { getWorkspaceMemberDetails },
  } = useMember();

  // const options = workspaceMembers?.map((member: any) => ({
  //   value: member.member.id,
  //   query: member.member.display_name,
  //   content: (
  //     <div className="flex items-center gap-2">
  //       <Avatar user={member.member} />
  //       {member.member.display_name}
  //     </div>
  //   ),
  // }));

  // const selectedOption = workspaceMembers?.find((member) => member.member.id === value);

  const filteredOptions =
    query === ""
      ? options
      : options?.filter((optionId) => {
          const memberDetails = getWorkspaceMemberDetails(optionId);

          return `${memberDetails?.member.display_name}`.toLowerCase().includes(query.toLowerCase());
        });

  const label = (
    <div className="flex w-full items-center justify-between gap-2 rounded border-[0.5px] border-custom-border-300 px-2.5 py-1.5 text-xs text-custom-text-300">
      {value ? (
        <>
          <Avatar name={value?.member.display_name} src={value?.member.avatar} />
          <span className="text-xs leading-4"> {value?.member.display_name}</span>
        </>
      ) : (
        <>
          <User2 className="h-[18px] w-[18px]" />
          <span className="text-xs leading-4">{placeholder}</span>
        </>
      )}
    </div>
  );

  return (
    <Listbox
      as="div"
      className={`flex-shrink-0 text-left`}
      value={value?.member.id}
      onChange={onChange}
      disabled={disabled}
    >
      <Listbox.Button as={React.Fragment}>
        <button
          ref={setReferenceElement}
          type="button"
          className={`flex w-full items-center justify-between gap-1 text-xs ${
            disabled ? "cursor-not-allowed text-custom-text-200" : "cursor-pointer hover:bg-custom-background-80"
          }`}
        >
          {label}
        </button>
      </Listbox.Button>
      <Listbox.Options>
        <div
          className={`z-10 my-1 w-48 whitespace-nowrap rounded border border-custom-border-300 bg-custom-background-100  px-2 py-2.5 text-xs focus:outline-none`}
          ref={setPopperElement}
          style={styles.popper}
          {...attributes.popper}
        >
          <div className="flex w-full items-center justify-start rounded border border-custom-border-200 bg-custom-background-90 px-2">
            <Search className="h-3.5 w-3.5 text-custom-text-300" />
            <Input
              className="w-full border-none bg-transparent px-2 py-1 text-xs text-custom-text-200 placeholder:text-custom-text-400 focus:outline-none"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
            />
          </div>
          <div className={`mt-2 max-h-48 space-y-1 overflow-y-scroll`}>
            {filteredOptions ? (
              filteredOptions.length > 0 ? (
                <>
                  {filteredOptions.map((memberId) => {
                    const workspaceMember = getWorkspaceMemberDetails(memberId);

                    if (!workspaceMember) return;

                    return (
                      <Listbox.Option
                        key={workspaceMember.id}
                        value={workspaceMember.member.id}
                        className={({ active, selected }) =>
                          `flex cursor-pointer select-none items-center justify-between gap-2 truncate rounded px-1 py-1.5 ${
                            active && !selected ? "bg-custom-background-80" : ""
                          } ${selected ? "text-custom-text-100" : "text-custom-text-200"}`
                        }
                      >
                        {() => (
                          <>
                            <div className="flex items-center gap-2">
                              <Avatar
                                name={workspaceMember?.member.display_name}
                                src={workspaceMember?.member.avatar}
                              />
                              {workspaceMember.member.display_name}
                            </div>
                            {value && value.member.id === workspaceMember.member.id && (
                              <Check className="h-3.5 w-3.5" />
                            )}
                          </>
                        )}
                      </Listbox.Option>
                    );
                  })}
                  <Listbox.Option
                    value=""
                    className="flex cursor-pointer select-none items-center justify-between gap-2 truncate rounded px-1 py-1.5 text-custom-text-200"
                  >
                    <span className="flex items-center justify-start gap-1 text-custom-text-200">
                      <span>No Lead</span>
                    </span>
                  </Listbox.Option>
                </>
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
      </Listbox.Options>
    </Listbox>
  );
};
