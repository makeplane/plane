import React, { useEffect, useState } from "react";
// swr
import useSWR from "swr";
// react hook form
import { useForm, Controller } from "react-hook-form";
// headless ui
import { Listbox, Transition } from "@headlessui/react";
// services
import issuesServices from "lib/services/issues.services";
// hooks
import useUser from "lib/hooks/useUser";
// fetching keys
import { PROJECT_ISSUE_LABELS } from "constants/fetch-keys";
// icons
import { CheckIcon, PlusIcon, XMarkIcon } from "@heroicons/react/20/solid";
// ui
import { Button, Input } from "ui";
// types
import type { Control } from "react-hook-form";
import type { IIssue, IIssueLabels } from "types";
import { TagIcon } from "@heroicons/react/24/outline";

type Props = {
  control: Control<IIssue, any>;
};

const defaultValues: Partial<IIssueLabels> = {
  name: "",
};

const SelectLabels: React.FC<Props> = ({ control }) => {
  const { activeWorkspace, activeProject } = useUser();

  const [isOpen, setIsOpen] = useState(false);

  const { data: issueLabels, mutate: issueLabelsMutate } = useSWR<IIssueLabels[]>(
    activeProject && activeWorkspace ? PROJECT_ISSUE_LABELS(activeProject.id) : null,
    activeProject && activeWorkspace
      ? () => issuesServices.getIssueLabels(activeWorkspace.slug, activeProject.id)
      : null
  );

  const onSubmit = async (data: IIssueLabels) => {
    if (!activeProject || !activeWorkspace || isSubmitting) return;
    await issuesServices
      .createIssueLabel(activeWorkspace.slug, activeProject.id, data)
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

  return (
    <Controller
      control={control}
      name="labels_list"
      render={({ field: { value, onChange } }) => (
        <Listbox
          value={value}
          onChange={(data: any) => {
            const valueCopy = [...(value ?? [])];
            if (valueCopy.some((i) => i === data)) onChange(valueCopy.filter((i) => i !== data));
            else onChange([...valueCopy, data]);
          }}
        >
          {({ open }) => (
            <>
              <div className="relative">
                <Listbox.Button className="flex items-center gap-1 hover:bg-gray-100 relative border rounded-md shadow-sm px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm duration-300">
                  <TagIcon className="h-3 w-3 text-gray-500" />
                  <span className="block truncate">
                    {value && value.length > 0
                      ? value.map((id) => issueLabels?.find((i) => i.id === id)?.name).join(", ")
                      : "Labels"}
                  </span>
                </Listbox.Button>

                <Transition
                  show={open}
                  as={React.Fragment}
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <Listbox.Options className="absolute z-10 mt-1 bg-white shadow-lg max-h-28 rounded-md text-xs ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
                    <div className="p-1">
                      {issueLabels?.map((label) => (
                        <Listbox.Option
                          key={label.id}
                          className={({ active }) =>
                            `${
                              active ? "text-white bg-theme" : "text-gray-900"
                            } cursor-pointer select-none w-full p-2 rounded-md`
                          }
                          value={label.id}
                        >
                          {({ selected, active }) => (
                            <>
                              <span
                                className={`${
                                  selected || (value ?? []).some((i) => i === label.id)
                                    ? "font-semibold"
                                    : "font-normal"
                                } block`}
                              >
                                {label.name}
                              </span>
                            </>
                          )}
                        </Listbox.Option>
                      ))}
                    </div>
                    <div className="cursor-default select-none relative p-2 min-w-[12rem]">
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
                            className="bg-green-600 text-white h-8 w-12 rounded-md grid place-items-center"
                            disabled={isSubmitting}
                            onClick={handleSubmit(onSubmit)}
                          >
                            <PlusIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="bg-red-600 text-white h-8 w-12 rounded-md grid place-items-center"
                            onClick={() => setIsOpen(false)}
                          >
                            <XMarkIcon className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="flex items-center gap-x-2 text-gray-400 hover:text-gray-500"
                          onClick={() => setIsOpen(true)}
                        >
                          <span>
                            <PlusIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                          </span>
                          <span>
                            <span className="block truncate">Create label</span>
                          </span>
                        </button>
                      )}
                    </div>
                  </Listbox.Options>
                </Transition>
              </div>
            </>
          )}
        </Listbox>
      )}
    ></Controller>
  );
};

export default SelectLabels;
