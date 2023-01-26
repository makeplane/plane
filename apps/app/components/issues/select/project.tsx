import { FC, Fragment } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// headless ui
import { Listbox, Transition } from "@headlessui/react";
// icons
import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
// services
import projectService from "services/project.service";
// fetch-keys
import { PROJECTS_LIST } from "constants/fetch-keys";

export interface IssueProjectSelectProps {
  value: string;
  onChange: (value: string) => void;
  setActiveProject: React.Dispatch<React.SetStateAction<string | null>>;
}

export const IssueProjectSelect: FC<IssueProjectSelectProps> = ({
  value,
  onChange,
  setActiveProject,
}) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  // Fetching Projects List
  const { data: projects } = useSWR(
    workspaceSlug ? PROJECTS_LIST(workspaceSlug as string) : null,
    () => (workspaceSlug ? projectService.getProjects(workspaceSlug as string) : null)
  );

  return (
    <>
      <Listbox
        value={value}
        onChange={(val) => {
          onChange(val);
          setActiveProject(val);
        }}
      >
        {({ open }) => (
          <>
            <div className="relative">
              <Listbox.Button className="relative flex cursor-pointer items-center gap-1 rounded-md border bg-white px-2 py-1 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm">
                <ClipboardDocumentListIcon className="h-3 w-3" />
                <span className="block truncate">
                  {projects?.find((i) => i.id === value)?.identifier ?? "Project"}
                </span>
              </Listbox.Button>

              <Transition
                show={open}
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Listbox.Options className="absolute z-10 mt-1 max-h-28 overflow-auto rounded-md bg-white py-1 text-xs shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1">
                    {projects ? (
                      projects.length > 0 ? (
                        projects.map((project) => (
                          <Listbox.Option
                            key={project.id}
                            className={({ active, selected }) =>
                              `${active ? "bg-indigo-50" : ""} ${
                                selected ? "bg-indigo-50 font-medium" : ""
                              } cursor-pointer select-none p-2 text-gray-900`
                            }
                            value={project.id}
                          >
                            {({ selected }) => (
                              <>
                                <span
                                  className={`${
                                    selected ? "font-medium" : "font-normal"
                                  } block truncate`}
                                >
                                  {project.name}
                                </span>
                              </>
                            )}
                          </Listbox.Option>
                        ))
                      ) : (
                        <p className="text-gray-400">No projects found!</p>
                      )
                    ) : (
                      <div className="text-sm text-gray-500 px-2">Loading...</div>
                    )}
                  </div>
                </Listbox.Options>
              </Transition>
            </div>
          </>
        )}
      </Listbox>
    </>
  );
};
