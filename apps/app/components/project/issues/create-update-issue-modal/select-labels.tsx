import React, { useEffect, useState } from "react";
// swr
import useSWR from "swr";
// react hook form
import { useForm, Controller } from "react-hook-form";
// headless ui
import { Listbox, Transition } from "@headlessui/react";
// services
import issuesServices from "lib/services/issues.service";
// hooks
import useUser from "lib/hooks/useUser";
// fetching keys
import { PROJECT_ISSUE_LABELS } from "constants/fetch-keys";
// icons
import { CheckIcon, PlusIcon, XMarkIcon } from "@heroicons/react/20/solid";
// ui
import { Button, Input, CustomListbox } from "ui";
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
        <CustomListbox
          title="Labels"
          options={issueLabels?.map((label) => {
            return { value: label.id, display: label.name };
          })}
          value={value}
          optionsFontsize="sm"
          onChange={onChange}
          icon={<TagIcon className="h-3 w-3 text-gray-500" />}
          footerOption={
            <div className="relative min-w-[12rem] cursor-default select-none p-2">
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
                    className="grid h-8 w-12 place-items-center rounded-md bg-green-600 text-white"
                    disabled={isSubmitting}
                    onClick={handleSubmit(onSubmit)}
                  >
                    <PlusIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="grid h-8 w-12 place-items-center rounded-md bg-red-600 text-white"
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
          }
        />
      )}
    />
  );
};

export default SelectLabels;
