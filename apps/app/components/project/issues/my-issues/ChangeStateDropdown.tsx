// react
import React from "react";
// swr
import useSWR from "swr";
// hooks
import useUser from "lib/hooks/useUser";
// constants
import { addSpaceIfCamelCase, classNames } from "constants/common";
import { STATE_LIST } from "constants/fetch-keys";
// services
import stateServices from "lib/services/state.services";
// ui
import { Listbox, Transition } from "@headlessui/react";
// types
import { IIssue, IState } from "types";

type Props = {
  issue: IIssue;
  updateIssues: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    issue: Partial<IIssue>
  ) => void;
};

const ChangeStateDropdown: React.FC<Props> = ({ issue, updateIssues }) => {
  const { activeWorkspace } = useUser();

  const { data: states } = useSWR<IState[]>(
    activeWorkspace ? STATE_LIST(issue.project) : null,
    activeWorkspace ? () => stateServices.getStates(activeWorkspace.slug, issue.project) : null
  );

  return (
    <>
      <Listbox
        as="div"
        value={issue.state}
        onChange={(data: string) => {
          if (!activeWorkspace) return;
          updateIssues(activeWorkspace.slug, issue.project, issue.id, {
            state: data,
            state_detail: states?.find((state) => state.id === data),
          });
        }}
        className="flex-shrink-0"
      >
        {({ open }) => (
          <>
            <div>
              <Listbox.Button
                className="inline-flex items-center whitespace-nowrap rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 border"
                style={{
                  border: `2px solid ${issue.state_detail.color}`,
                  backgroundColor: `${issue.state_detail.color}20`,
                }}
              >
                <span
                  className={classNames(
                    issue.state ? "" : "text-gray-900",
                    "hidden capitalize sm:block w-16"
                  )}
                >
                  {addSpaceIfCamelCase(issue.state_detail.name)}
                </span>
              </Listbox.Button>

              <Transition
                show={open}
                as={React.Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Listbox.Options className="absolute z-10 mt-1 bg-white shadow-lg max-h-28 rounded-md py-1 text-xs ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
                  {states?.map((state) => (
                    <Listbox.Option
                      key={state.id}
                      className={({ active }) =>
                        classNames(
                          active ? "bg-indigo-50" : "bg-white",
                          "cursor-pointer select-none px-3 py-2"
                        )
                      }
                      value={state.id}
                    >
                      {addSpaceIfCamelCase(state.name)}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          </>
        )}
      </Listbox>
    </>
  );
};

export default ChangeStateDropdown;
