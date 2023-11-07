import React, { forwardRef, useEffect } from "react";
import { useRouter } from "next/router";
import { TwitterPicker } from "react-color";
import { Controller, SubmitHandler, useForm } from "react-hook-form";

// stores
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";
// headless ui
import { Popover, Transition } from "@headlessui/react";
// ui
import { Button, Input } from "@plane/ui";
// types
import { IIssueLabels } from "types";
// fetch-keys
import { getRandomLabelColor, LABEL_COLOR_OPTIONS } from "constants/label";
import useToast from "hooks/use-toast";

type Props = {
  labelForm: boolean;
  setLabelForm: React.Dispatch<React.SetStateAction<boolean>>;
  isUpdating: boolean;
  labelToUpdate: IIssueLabels | null;
  onClose?: () => void;
};

const defaultValues: Partial<IIssueLabels> = {
  name: "",
  color: "rgb(var(--color-text-200))",
};

export const CreateUpdateLabelInline = observer(
  forwardRef<HTMLFormElement, Props>(function CreateUpdateLabelInline(props, ref) {
    const { labelForm, setLabelForm, isUpdating, labelToUpdate, onClose } = props;

    // router
    const router = useRouter();
    const { workspaceSlug, projectId } = router.query;

    // store
    const { projectLabel: projectLabelStore } = useMobxStore();

    const { setToastAlert } = useToast();

    const {
      handleSubmit,
      control,
      reset,
      formState: { errors, isSubmitting },
      watch,
      setValue,
      setFocus,
    } = useForm<IIssueLabels>({
      defaultValues,
    });

    const handleClose = () => {
      setLabelForm(false);
      reset(defaultValues);
      if (onClose) onClose();
    };

    const handleLabelCreate: SubmitHandler<IIssueLabels> = async (formData) => {
      if (!workspaceSlug || !projectId || isSubmitting) return;

      await projectLabelStore
        .createLabel(workspaceSlug.toString(), projectId.toString(), formData)
        .then(() => {
          handleClose();
          reset(defaultValues);
        })
        .catch((error) => {
          setToastAlert({
            title: "Oops!",
            type: "error",
            message: error?.error ?? "Error while adding the label",
          });
          reset(formData);
        });
    };

    const handleLabelUpdate: SubmitHandler<IIssueLabels> = async (formData) => {
      if (!workspaceSlug || !projectId || isSubmitting) return;

      await projectLabelStore
        .updateLabel(workspaceSlug.toString(), projectId.toString(), labelToUpdate?.id!, formData)
        .then(() => {
          reset(defaultValues);
          handleClose();
        })
        .catch((error) => {
          setToastAlert({
            title: "Oops!",
            type: "error",
            message: error?.error ?? "Error while updating the label",
          });
          reset(formData);
        });
    };

    /**
     * For settings focus on name input
     */
    useEffect(() => {
      setFocus("name");
    }, [setFocus, labelForm]);

    useEffect(() => {
      if (!labelToUpdate) return;

      setValue("name", labelToUpdate.name);
      setValue("color", labelToUpdate.color && labelToUpdate.color !== "" ? labelToUpdate.color : "#000");
    }, [labelToUpdate, setValue]);

    useEffect(() => {
      if (labelToUpdate) {
        setValue("color", labelToUpdate.color && labelToUpdate.color !== "" ? labelToUpdate.color : "#000");
        return;
      }

      setValue("color", getRandomLabelColor());
    }, [labelToUpdate, setValue]);

    return (
      <form
        ref={ref}
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(isUpdating ? handleLabelUpdate : handleLabelCreate)();
        }}
        className={`flex scroll-m-8 items-center gap-2 rounded border border-custom-border-200 bg-custom-background-100 px-3.5 py-2 ${
          labelForm ? "" : "hidden"
        }`}
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
                    className="h-4 w-4 rounded-full"
                    style={{
                      backgroundColor: watch("color"),
                    }}
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
          <Controller
            control={control}
            name="name"
            rules={{
              required: "Label title is required",
            }}
            render={({ field: { value, onChange, ref } }) => (
              <Input
                id="labelName"
                name="name"
                type="text"
                value={value}
                onChange={onChange}
                ref={ref}
                hasError={Boolean(errors.name)}
                placeholder="Label title"
                className="w-full"
              />
            )}
          />
        </div>
        <Button variant="neutral-primary" onClick={() => handleClose()}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" loading={isSubmitting}>
          {isUpdating ? (isSubmitting ? "Updating" : "Update") : isSubmitting ? "Adding" : "Add"}
        </Button>
      </form>
    );
  })
);
