import { useState, FC, Fragment } from "react";
import Image from "next/image";
import useSWR from "swr";
import { UserIcon } from "@heroicons/react/24/outline";
import { Transition, Combobox } from "@headlessui/react";
// service
import projectServices from "services/project.service";
// types
import type { IIssue, IProjectMember } from "types";
// fetch keys
import { PROJECT_MEMBERS } from "constants/fetch-keys";

export type IssueAssigneeSelectProps = {
  workspaceSlug: string;
  projectId: string;
  label?: string;
  value: string[];
  onChange: (value: string[]) => void;
};

type AssigneeAvatarProps = {
  people: IProjectMember[];
  userId: string;
};

export const AssigneeAvatar: FC<AssigneeAvatarProps> = (props) => {
  const { people, userId } = props;
  const user = people?.find((p) => p.member.id === userId);

  if (!user) return <></>;

  if (user.member.avatar && user.member.avatar !== "") {
    return (
      <div className="relative h-4 w-4">
        <Image
          src={user.member.avatar}
          alt="avatar"
          className="rounded-full"
          layout="fill"
          objectFit="cover"
        />
      </div>
    );
  } else
    return (
      <div className="grid h-4 w-4 flex-shrink-0 place-items-center rounded-full bg-gray-700 capitalize text-white">
        {user.member.first_name && user.member.first_name !== ""
          ? user.member.first_name.charAt(0)
          : user.member.email.charAt(0)}
      </div>
    );
};

export const IssueAssigneeSelect: FC<IssueAssigneeSelectProps> = (props) => {
  const { workspaceSlug, projectId, label = "Assignees", value = [], onChange } = props;
  // states
  const [query, setQuery] = useState("");
  // fetching project members
  const { data: people } = useSWR(
    workspaceSlug && projectId ? PROJECT_MEMBERS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectServices.projectMembers(workspaceSlug as string, projectId as string)
      : null
  );

  const options = people?.map((person) => ({
    value: person.member.id,
    display:
      person.member.first_name && person.member.first_name !== ""
        ? person.member.first_name
        : person.member.email,
  }));

  const filteredOptions =
    query === ""
      ? options
      : options?.filter((option) => option.display.toLowerCase().includes(query.toLowerCase()));

  const optionValue = options?.filter((o) => value.includes(o.value));

  return (
    <Combobox
      as="div"
      value={optionValue}
      onChange={(v) => onChange(v.map((i) => i.value))}
      className="relative flex-shrink-0"
      multiple={true}
    >
      {({ open }: any) => (
        <>
          <Combobox.Label className="sr-only">{label}</Combobox.Label>
          <Combobox.Button
            className={`flex cursor-pointer items-center gap-1 rounded-md border px-2 py-1 text-xs shadow-sm duration-300 hover:bg-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500`}
          >
            <UserIcon className="h-3 w-3 text-gray-500" />
            <span
              className={`hidden truncate sm:block ${
                value === null || value === undefined ? "" : "text-gray-900"
              }`}
            >
              {Array.isArray(value)
                ? value
                    .map((v) => options?.find((option) => option.value === v)?.display)
                    .join(", ") || label
                : options?.find((option) => option.value === value)?.display || label}
            </span>
          </Combobox.Button>

          <Transition
            show={open}
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Combobox.Options
              className={`absolute z-10 mt-1 max-h-32 min-w-[8rem] overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none text-xs`}
            >
              <Combobox.Input
                className="w-full border-b bg-transparent p-2 text-xs focus:outline-none"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search"
                displayValue={(assigned: any) => assigned?.name}
              />
              <div className="py-1">
                {filteredOptions ? (
                  filteredOptions.length > 0 ? (
                    filteredOptions.map((option) => (
                      <Combobox.Option
                        key={option.value}
                        className={({ active }) =>
                          `${
                            active ? "bg-indigo-50" : ""
                          } flex cursor-pointer select-none items-center gap-2 truncate p-2 text-gray-900`
                        }
                        value={option.value}
                      >
                        {people && <AssigneeAvatar userId={option.value} people={people} />}
                        {/* {option.element ?? option.display} */}
                      </Combobox.Option>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No {label.toLowerCase()} found</p>
                  )
                ) : (
                  <p className="text-sm text-gray-500">Loading...</p>
                )}
              </div>
            </Combobox.Options>
          </Transition>
        </>
      )}
    </Combobox>
  );
};
