import React, { forwardRef, useEffect } from "react";

import { useRouter } from "next/router";

// mobx
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";

// react-hook-form
import { Controller, SubmitHandler, useForm } from "react-hook-form";
// hooks
import useUserAuth from "hooks/use-user-auth";
// react-color
import { TwitterPicker } from "react-color";
// headless ui
import { Popover, Transition } from "@headlessui/react";
// ui
import { Input, PrimaryButton, SecondaryButton } from "components/ui";
// icons
import { ChevronDownIcon } from "@heroicons/react/24/outline";
// types
import { IIssueLabels, LabelLite } from "types";
// fetch-keys
import { getRandomLabelColor, LABEL_COLOR_OPTIONS } from "constants/label";

type Props = {
  labelForm: boolean;
  setLabelForm: React.Dispatch<React.SetStateAction<boolean>>;
  isUpdating: boolean;
  labelToUpdate: LabelLite | null;
  onClose?: () => void;
};

const defaultValues: Partial<IIssueLabels> = {
  name: "",
  color: "rgb(var(--color-text-200))",
};

export const CreateUpdateLabelInline = observer(
  forwardRef<HTMLDivElement, Props>(function CreateUpdateLabelInline(props, ref) {
    const { labelForm, setLabelForm, isUpdating, labelToUpdate, onClose } = props;

    const router = useRouter();
    const { workspaceSlug, projectId } = router.query;

    const { label: labelStore } = useMobxStore();
    const { createLabel, updateLabel } = labelStore;

    const { user } = useUserAuth();

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

    const handleClose = () => {
      setLabelForm(false);
      reset(defaultValues);
      if (onClose) onClose();
    };

    const handleLabelCreate: SubmitHandler<IIssueLabels> = async (formData) => {
      if (!workspaceSlug || !projectId || isSubmitting || !user) return;

      await createLabel(workspaceSlug.toString(), projectId.toString(), formData, user).finally(
        () => {
          handleClose();
        }
      );
    };

    const handleLabelUpdate: SubmitHandler<IIssueLabels> = async (formData) => {
      if (!workspaceSlug || !projectId || isSubmitting || !user) return;

      await updateLabel(
        workspaceSlug.toString(),
        projectId.toString(),
        labelToUpdate?.id ?? "",
        formData,
        user
      ).finally(() => {
        handleClose();
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

    useEffect(() => {
      if (labelToUpdate) {
        setValue(
          "color",
          labelToUpdate.color && labelToUpdate.color !== "" ? labelToUpdate.color : "#000"
        );
        return;
      }

      setValue("color", getRandomLabelColor());
    }, [labelToUpdate, setValue]);

    return (
      <div
        className={`flex scroll-m-8 items-center gap-2 rounded-[10px] border border-custom-border-200 bg-custom-background-100 p-5 ${
          labelForm ? "" : "hidden"
        }`}
        ref={ref}
      >
        <div className="flex-shrink-0">
          <Popover className="relative z-10 flex h-full w-full items-center justify-center">
            {({ open }) => (
              <>
                <Popover.Button
                  className={`group inline-flex items-center text-base font-medium focus:outline-none ${
                    open ? "text-custom-text-100" : "text-custom-text-200"
                  }`}
                >
                  <span
                    className="h-5 w-5 rounded"
                    style={{
                      backgroundColor: watch("color"),
                    }}
                  />
                  <ChevronDownIcon
                    className={`ml-2 h-5 w-5 group-hover:text-custom-text-200 ${
                      open ? "text-gray-600" : "text-gray-400"
                    }`}
                    aria-hidden="true"
                  />
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
                        <TwitterPicker
                          colors={LABEL_COLOR_OPTIONS}
                          color={value}
                          onChange={(value) => onChange(value.hex)}
                        />
                      )}
                    />
                  </Popover.Panel>
                </Transition>
              </>
            )}
          </Popover>
        </div>
        <div className="flex flex-1 flex-col justify-center">
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
        <SecondaryButton onClick={() => handleClose()}>Cancel</SecondaryButton>
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
  })
);
