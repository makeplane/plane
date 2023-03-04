import React, { useState } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// services
import stateService from "services/state.service";
// headless ui
import {
  Squares2X2Icon,
  PlusIcon,
  MagnifyingGlassIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
// icons
import { Combobox, Transition } from "@headlessui/react";
// helpers
import { getStatesList } from "helpers/state.helper";
// fetch keys
import { STATE_LIST } from "constants/fetch-keys";
import { getStateGroupIcon } from "components/icons";

type Props = {
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  value: string;
  onChange: (value: string) => void;
  projectId: string;
};

export const IssueStateSelect: React.FC<Props> = ({ setIsOpen, value, onChange, projectId }) => {
  // states
  const [query, setQuery] = useState("");

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { data: stateGroups } = useSWR(
    workspaceSlug && projectId ? STATE_LIST(projectId) : null,
    workspaceSlug && projectId
      ? () => stateService.getStates(workspaceSlug as string, projectId)
      : null
  );
  const states = getStatesList(stateGroups ?? {});

  const options = states?.map((state) => ({
    value: state.id,
    display: state.name,
    color: state.color,
    group: state.group,
  }));

  const filteredOptions =
    query === ""
      ? options
      : options?.filter((option) => option.display.toLowerCase().includes(query.toLowerCase()));

  const currentOption = options?.find((option) => option.value === value);
  return (
    <Combobox
      as="div"
      value={value}
      onChange={(val: any) => onChange(val)}
      className="relative flex-shrink-0"
    >
      {({ open }: any) => (
        <>
          <Combobox.Button
            className={({ open }) =>
              `flex cursor-pointer items-center rounded-md border text-xs shadow-sm duration-200 
            ${
              open ? "border-theme bg-theme/5 outline-none ring-1 ring-theme " : "hover:bg-theme/5"
            }`
            }
          >
            {value && value !== "" ? (
              <span className="flex items-center justify-center gap-2 px-3 py-1.5 text-xs">
                {currentOption && currentOption.group
                  ? getStateGroupIcon(currentOption.group, "16", "16", currentOption.color)
                  : ""}
                <span className=" text-gray-600">{currentOption?.display}</span>
              </span>
            ) : (
              <span className="flex items-center justify-center  gap-2  px-3  py-1.5 text-xs">
                <Squares2X2Icon className="h-4 w-4 text-gray-500 " />
                <span className=" text-gray-500">{currentOption?.display || "State"}</span>
              </span>
            )}
          </Combobox.Button>

          <Transition
            show={open}
            as={React.Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <Combobox.Options
              className={`absolute z-10 mt-1 max-h-52 min-w-[8rem] overflow-auto rounded-md border-none 
              bg-white px-2 py-2 text-xs shadow-md focus:outline-none`}
            >
              <div className="flex w-full items-center justify-start rounded-sm border-[0.6px] bg-gray-100 px-2">
                <MagnifyingGlassIcon className="h-3 w-3 text-gray-500" />
                <Combobox.Input
                  className="w-full  bg-transparent py-1 px-2  text-xs text-gray-500 focus:outline-none"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search States"
                  displayValue={(assigned: any) => assigned?.name}
                />
              </div>
              <div className="py-1.5">
                {filteredOptions ? (
                  filteredOptions.length > 0 ? (
                    filteredOptions.map((option) => (
                      <Combobox.Option
                        key={option.value}
                        className={({ active }) =>
                          `${
                            active ? "bg-gray-200" : ""
                          } group flex min-w-[14rem] cursor-pointer select-none items-center gap-2 truncate rounded px-1 py-1.5 text-gray-600`
                        }
                        value={option.value}
                      >
                        {({ selected, active }) =>
                          states && (
                            <div className="flex w-full justify-between gap-2 rounded">
                              <div className="flex items-center justify-start gap-2">
                                {getStateGroupIcon(option.group, "16", "16", option.color)}
                                <span>{option.display}</span>
                              </div>
                              <div className="flex items-center justify-center rounded p-1">
                                <CheckIcon
                                  className={`h-3 w-3 ${selected ? "opacity-100" : "opacity-0"}`}
                                />
                              </div>
                            </div>
                          )
                        }
                      </Combobox.Option>
                    ))
                  ) : (
                    <p className="px-2 text-xs text-gray-500">No states found</p>
                  )
                ) : (
                  <p className="px-2 text-xs text-gray-500">Loading...</p>
                )}
                <button
                  type="button"
                  className="flex w-full select-none items-center rounded py-2 px-1 hover:bg-gray-200"
                  onClick={() => setIsOpen(true)}
                >
                  <span className="flex items-center justify-start gap-1">
                    <PlusIcon className="h-4 w-4 text-gray-600" aria-hidden="true" />
                    <span className="text-gray-600">Create New State</span>
                  </span>
                </button>
              </div>
            </Combobox.Options>
          </Transition>
        </>
      )}
    </Combobox>
  );
};
