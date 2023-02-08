import React, { useEffect, useState } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// react-hook-form
import { useForm } from "react-hook-form";
// headless ui
import { Combobox, Transition } from "@headlessui/react";
// icons
import { TagIcon } from "@heroicons/react/24/outline";
// services
import issuesServices from "services/issues.service";
// types
import type { IIssueLabels } from "types";
// fetch-keys
import { PROJECT_ISSUE_LABELS } from "constants/fetch-keys";

type Props = {
  value: string[];
  onChange: (value: string[]) => void;
  projectId: string;
};

const defaultValues: Partial<IIssueLabels> = {
  name: "",
};

export const IssueLabelSelect: React.FC<Props> = ({ value, onChange, projectId }) => {
  // states
  const [query, setQuery] = useState("");

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const [isOpen, setIsOpen] = useState(false);

  const { data: issueLabels, mutate: issueLabelsMutate } = useSWR<IIssueLabels[]>(
    projectId ? PROJECT_ISSUE_LABELS(projectId) : null,
    workspaceSlug && projectId
      ? () => issuesServices.getIssueLabels(workspaceSlug as string, projectId)
      : null
  );

  const onSubmit = async (data: IIssueLabels) => {
    if (!projectId || !workspaceSlug || isSubmitting) return;
    await issuesServices
      .createIssueLabel(workspaceSlug as string, projectId as string, data)
      .then((response) => {
        issueLabelsMutate((prevData) => [...(prevData ?? []), response], false);
        setIsOpen(false);
        reset(defaultValues);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
    setFocus,
    reset,
  } = useForm<IIssueLabels>({ defaultValues });

  useEffect(() => {
    isOpen && setFocus("name");
  }, [isOpen, setFocus]);

  const options = issueLabels?.map((label) => ({
    value: label.id,
    display: label.name,
    color: label.color,
  }));

  const filteredOptions =
    query === ""
      ? options
      : options?.filter((option) => option.display.toLowerCase().includes(query.toLowerCase()));

  return (
    <>
      <Combobox
        as="div"
        value={value}
        onChange={(val) => onChange(val)}
        className="relative flex-shrink-0"
        multiple
      >
        {({ open }: any) => (
          <>
            <Combobox.Label className="sr-only">Labels</Combobox.Label>
            <Combobox.Button
              className={`flex cursor-pointer items-center gap-1 rounded-md border px-2 py-1 text-xs shadow-sm duration-300 hover:bg-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500`}
            >
              <TagIcon className="h-3 w-3 text-gray-500" />
              <span className={`flex items-center gap-2 ${!value ? "" : "text-gray-900"}`}>
                {Array.isArray(value)
                  ? value
                      .map((v) => options?.find((option) => option.value === v)?.display)
                      .join(", ") || "Labels"
                  : options?.find((option) => option.value === value)?.display || "Labels"}
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
                          className={({ active, selected }) =>
                            `${active ? "bg-indigo-50" : ""} ${
                              selected ? "bg-indigo-50 font-medium" : ""
                            } flex cursor-pointer select-none items-center gap-2 truncate p-2 text-gray-900`
                          }
                          value={option.value}
                        >
                          {issueLabels && (
                            <>
                              <span
                                className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                                style={{
                                  backgroundColor: option.color,
                                }}
                              />
                              {option.display}
                            </>
                          )}
                        </Combobox.Option>
                      ))
                    ) : (
                      <p className="text-xs text-gray-500 px-2">No labels found</p>
                    )
                  ) : (
                    <p className="text-xs text-gray-500 px-2">Loading...</p>
                  )}
                  {/* <div className="cursor-default select-none p-2 hover:bg-indigo-50 hover:text-gray-900">
                    {isOpen ? (
                      <div className="flex items-center gap-x-1">
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          placeholder="Title"
                          className="w-full"
                          autoComplete="off"
                          register={register}
                          validations={{
                            required: true,
                          }}
                        />
                        <button
                          type="button"
                          className="grid place-items-center text-green-600"
                          disabled={isSubmitting}
                          onClick={handleSubmit(onSubmit)}
                        >
                          <PlusIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="grid place-items-center text-red-600"
                          onClick={() => setIsOpen(false)}
                        >
                          <XMarkIcon className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="flex items-center gap-2 w-full"
                        onClick={() => setIsOpen(true)}
                      >
                        <PlusIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
                        <span className="text-xs whitespace-nowrap">Create label</span>
                      </button>
                    )}
                  </div> */}
                </div>
              </Combobox.Options>
            </Transition>
          </>
        )}
      </Combobox>
    </>
  );
};
