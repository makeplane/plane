import React, { useState } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// headless ui
import { Transition, Combobox } from "@headlessui/react";
// services
import workspaceService from "services/workspace.service";
// types
import type { Props } from "./types";
// fetch-keys
import { WORKSPACE_MEMBERS } from "constants/fetch-keys";

const SearchListbox: React.FC<Props> = ({
  title,
  options,
  onChange,
  value,
  multiple: canSelectMultiple,
  icon,
  optionsFontsize,
  buttonClassName,
  optionsClassName,
  assignee = false,
}) => {
  const [query, setQuery] = useState("");

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const filteredOptions =
    query === ""
      ? options
      : options?.filter((option) => option.display.toLowerCase().includes(query.toLowerCase()));

  const props: any = {
    value,
    onChange,
  };

  if (canSelectMultiple) {
    props.value = props.value ?? [];
    props.onChange = (value: string[]) => {
      onChange(value);
    };
    props.multiple = true;
  }

  const { data: people } = useSWR(
    workspaceSlug ? WORKSPACE_MEMBERS(workspaceSlug as string) : null,
    workspaceSlug ? () => workspaceService.workspaceMembers(workspaceSlug as string) : null
  );

  const userAvatar = (userId: string) => {
    const user = people?.find((p) => p.member.id === userId);

    if (!user) return;

    if (user.member.avatar && user.member.avatar !== "") {
      return (
        <div className="relative h-4 w-4">
          <img
            src={user.member.avatar}
            className="absolute top-0 left-0 h-full w-full object-cover rounded-full"
            alt="avatar"
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

  return (
    <Combobox as="div" {...props} className="relative flex-shrink-0">
      {({ open }: any) => (
        <>
          <Combobox.Label className="sr-only">{title}</Combobox.Label>
          <Combobox.Button
            className={`flex cursor-pointer items-center gap-1 rounded-md border  border-custom-border-100 px-2 py-1 text-xs shadow-sm duration-300 hover:bg-custom-background-90 focus:border-custom-primary focus:outline-none focus:ring-1 focus:ring-custom-primary ${
              buttonClassName || ""
            }`}
          >
            {icon ?? null}
            <span
              className={`hidden truncate sm:block ${
                value === null || value === undefined ? "" : "text-custom-text-100"
              }`}
            >
              {Array.isArray(value)
                ? value
                    .map((v) => options?.find((option) => option.value === v)?.display)
                    .join(", ") || title
                : options?.find((option) => option.value === value)?.display || title}
            </span>
          </Combobox.Button>

          <Transition
            show={open}
            as={React.Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Combobox.Options
              className={`absolute z-10 mt-1 max-h-32 min-w-[8rem] overflow-auto rounded-md bg-custom-background-80 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none  ${
                optionsFontsize === "sm"
                  ? "text-xs"
                  : optionsFontsize === "md"
                  ? "text-base"
                  : optionsFontsize === "lg"
                  ? "text-lg"
                  : optionsFontsize === "xl"
                  ? "text-xl"
                  : optionsFontsize === "2xl"
                  ? "text-2xl"
                  : ""
              } ${optionsClassName || ""}`}
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
                          } flex cursor-pointer select-none items-center gap-2 truncate p-2 text-custom-text-100`
                        }
                        value={option.value}
                      >
                        {assignee && userAvatar(option.value)}
                        {option.element ?? option.display}
                      </Combobox.Option>
                    ))
                  ) : (
                    <p className="text-xs text-custom-text-200 px-2">
                      No {title.toLowerCase()} found
                    </p>
                  )
                ) : (
                  <p className="text-xs text-custom-text-200 px-2">Loading...</p>
                )}
              </div>
            </Combobox.Options>
          </Transition>
        </>
      )}
    </Combobox>
  );
};

export default SearchListbox;
