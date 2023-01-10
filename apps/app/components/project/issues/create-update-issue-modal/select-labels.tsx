import React, { useEffect, useState } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

import { useForm, Controller } from "react-hook-form";
import type { Control } from "react-hook-form";
// services
import issuesServices from "lib/services/issues.service";
// fetching keys
import { PROJECT_ISSUE_LABELS } from "constants/fetch-keys";
// icons
import { PlusIcon, XMarkIcon } from "@heroicons/react/20/solid";
// ui
import { Input, CustomListbox } from "ui";
// icons
import { TagIcon } from "@heroicons/react/24/outline";
// types
import type { IIssue, IIssueLabels } from "types";

type Props = {
  control: Control<IIssue, any>;
};

const defaultValues: Partial<IIssueLabels> = {
  name: "",
};

const SelectLabels: React.FC<Props> = ({ control }) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const [isOpen, setIsOpen] = useState(false);

  const { data: issueLabels, mutate: issueLabelsMutate } = useSWR<IIssueLabels[]>(
    workspaceSlug && projectId ? PROJECT_ISSUE_LABELS(workspaceSlug as string) : null,
    workspaceSlug && projectId
      ? () => issuesServices.getIssueLabels(workspaceSlug as string, projectId as string)
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

  return (
    <Controller
      control={control}
      name="labels_list"
      render={({ field: { value, onChange } }) => (
        <CustomListbox
          title="Labels"
          options={issueLabels?.map((label) => {
            return { value: label.id, display: label.name, color: label.colour };
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
