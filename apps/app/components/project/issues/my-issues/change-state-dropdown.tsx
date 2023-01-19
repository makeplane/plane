import React from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// headless ui
import { Listbox, Transition } from "@headlessui/react";
// services
import stateServices from "services/state.service";
// helpers
import { addSpaceIfCamelCase } from "helpers/string.helper";
// types
import { IIssue, IState } from "types";
// fetch-keys
import { STATE_LIST } from "constants/fetch-keys";

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
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { data: states } = useSWR<IState[]>(
    workspaceSlug ? STATE_LIST(issue.project) : null,
    workspaceSlug ? () => stateServices.getStates(workspaceSlug as string, issue.project) : null
  );

  return (
    <>
      <Listbox
        as="div"
        value={issue.state}
        onChange={(data: string) => {
          if (!workspaceSlug) return;
          updateIssues(workspaceSlug as string, issue.project, issue.id, {
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
                className="inline-flex items-center whitespace-nowrap rounded-full border bg-gray-50 px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100"
                style={{
                  border: `2px solid ${issue.state_detail.color}`,
                  backgroundColor: `${issue.state_detail.color}20`,
                }}
              >
                <span
                  className={`hidden w-16 capitalize sm:block ${
                    issue.state ? "" : "text-gray-900"
                  }`}
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
                <Listbox.Options className="fixed z-10 mt-1 max-h-28 overflow-auto rounded-md bg-white py-1 text-xs shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  {states?.map((state) => (
                    <Listbox.Option
                      key={state.id}
                      className={({ active }) =>
                        `cursor-pointer select-none px-3 py-2 ${
                          active ? "bg-indigo-50" : "bg-white"
                        }`
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
