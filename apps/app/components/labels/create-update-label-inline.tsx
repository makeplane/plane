import React, { forwardRef, useEffect } from "react";

import { useRouter } from "next/router";

import { mutate } from "swr";

// react-hook-form
import { Controller, SubmitHandler, useForm } from "react-hook-form";
// react-color
import { TwitterPicker } from "react-color";
// headless ui
import { Popover, Transition } from "@headlessui/react";
// services
import issuesService from "services/issues.service";
// ui
import { Input, PrimaryButton, SecondaryButton } from "components/ui";
// types
import { IIssueLabels } from "types";
// fetch-keys
import { PROJECT_ISSUE_LABELS } from "constants/fetch-keys";

type Props = {
  labelForm: boolean;
  setLabelForm: React.Dispatch<React.SetStateAction<boolean>>;
  isUpdating: boolean;
  labelToUpdate: IIssueLabels | null;
};

const defaultValues: Partial<IIssueLabels> = {
  name: "",
  color: "#ff0000",
};

type Ref = HTMLDivElement;

export const CreateUpdateLabelInline = forwardRef<Ref, Props>(function CreateUpdateLabelInline(
  { labelForm, setLabelForm, isUpdating, labelToUpdate },
  ref
) {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const {
    handleSubmit,
    control,
    register,
    reset,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<IIssueLabels>({
    defaultValues,
  });

  const handleLabelCreate: SubmitHandler<IIssueLabels> = async (formData) => {
    if (!workspaceSlug || !projectId || isSubmitting) return;

    await issuesService
      .createIssueLabel(workspaceSlug as string, projectId as string, formData)
      .then((res) => {
        mutate<IIssueLabels[]>(
          PROJECT_ISSUE_LABELS(projectId as string),
          (prevData) => [res, ...(prevData ?? [])],
          false
        );
        reset(defaultValues);
        setLabelForm(false);
      });
  };

  const handleLabelUpdate: SubmitHandler<IIssueLabels> = async (formData) => {
    if (!workspaceSlug || !projectId || isSubmitting) return;

    await issuesService
      .patchIssueLabel(
        workspaceSlug as string,
        projectId as string,
        labelToUpdate?.id ?? "",
        formData
      )
      .then(() => {
        reset(defaultValues);
        mutate<IIssueLabels[]>(
          PROJECT_ISSUE_LABELS(projectId as string),
          (prevData) =>
            prevData?.map((p) => (p.id === labelToUpdate?.id ? { ...p, ...formData } : p)),
          false
        );
        setLabelForm(false);
      });
  };

  useEffect(() => {
    if (!labelForm && isUpdating) return;

    reset();
  }, [labelForm, isUpdating, reset]);

  useEffect(() => {
    if (!labelToUpdate) return;

    setValue(
      "color",
      labelToUpdate.color && labelToUpdate.color !== "" ? labelToUpdate.color : "#000"
    );
    setValue("name", labelToUpdate.name);
  }, [labelToUpdate, setValue]);

  return (
    <div
      className={`flex items-center gap-2 scroll-m-8 rounded-[10px] border border-brand-base bg-brand-surface-2 p-5 ${
        labelForm ? "" : "hidden"
      }`}
      ref={ref}
    >
      <div className="h-8 w-8 flex-shrink-0">
        <Popover className="relative z-10 flex h-full w-full items-center justify-center rounded-xl bg-brand-surface-2">
          {({ open }) => (
            <>
              <Popover.Button
                className={`group inline-flex items-center text-base font-medium focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 ${
                  open ? "text-brand-base" : "text-brand-secondary"
                }`}
              >
                {watch("color") && watch("color") !== "" && (
                  <span
                    className="h-4 w-4 rounded"
                    style={{
                      backgroundColor: watch("color") ?? "#000",
                    }}
                  />
                )}
              </Popover.Button>

              <Transition
                as={React.Fragment}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 translate-y-1"
                enterTo="opacity-100 translate-y-0"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-1"
              >
                <Popover.Panel className="absolute top-full left-0 z-20 mt-3 w-screen max-w-xs px-2 sm:px-0">
                  <Controller
                    name="color"
                    control={control}
                    render={({ field: { value, onChange } }) => (
                      <TwitterPicker color={value} onChange={(value) => onChange(value.hex)} />
                    )}
                  />
                </Popover.Panel>
              </Transition>
            </>
          )}
        </Popover>
      </div>
      <div className="flex w-full flex-col justify-center">
        <Input
          type="text"
          id="labelName"
          name="name"
          register={register}
          placeholder="Label title"
          validations={{
            required: "Label title is required",
          }}
          error={errors.name}
        />
      </div>
      <SecondaryButton
        onClick={() => {
          reset();
          setLabelForm(false);
        }}
      >
        Cancel
      </SecondaryButton>
      {isUpdating ? (
        <PrimaryButton onClick={handleSubmit(handleLabelUpdate)} loading={isSubmitting}>
          {isSubmitting ? "Updating" : "Update"}
        </PrimaryButton>
      ) : (
        <PrimaryButton onClick={handleSubmit(handleLabelCreate)} loading={isSubmitting}>
          {isSubmitting ? "Adding" : "Add"}
        </PrimaryButton>
      )}
    </div>
  );
});
