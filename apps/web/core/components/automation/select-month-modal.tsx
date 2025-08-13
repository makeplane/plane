"use client";

import React from "react";
import { useParams } from "next/navigation";
// react-hook-form
import { Controller, useForm } from "react-hook-form";
import type { IProject } from "@plane/types";
// ui
import { Button, Input, Dialog, EModalWidth } from "@plane/ui";
// types

// types
type Props = {
  isOpen: boolean;
  type: "auto-close" | "auto-archive";
  initialValues: Partial<IProject>;
  handleClose: () => void;
  handleChange: (formData: Partial<IProject>) => Promise<void>;
};

export const SelectMonthModal: React.FC<Props> = ({ type, initialValues, isOpen, handleClose, handleChange }) => {
  const { workspaceSlug, projectId } = useParams();

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    control,
    reset,
  } = useForm<IProject>({
    defaultValues: initialValues,
  });

  const onClose = () => {
    handleClose();
    reset(initialValues);
  };

  const onSubmit = (formData: Partial<IProject>) => {
    if (!workspaceSlug && !projectId) return;
    handleChange(formData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <Dialog.Panel width={EModalWidth.XXL}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div>
            <Dialog.Title className="text-lg font-medium leading-6 text-custom-text-100">
              Customize time range
            </Dialog.Title>
            <div className="mt-8 flex items-center gap-2">
              <div className="flex w-full flex-col justify-center gap-1">
                {type === "auto-close" ? (
                  <>
                    <Controller
                      control={control}
                      name="close_in"
                      rules={{
                        required: "Select a month between 1 and 12.",
                        min: 1,
                        max: 12,
                      }}
                      render={({ field: { value, onChange, ref } }) => (
                        <div className="relative flex w-full flex-col justify-center gap-1">
                          <Input
                            id="close_in"
                            name="close_in"
                            type="number"
                            value={value?.toString()}
                            onChange={onChange}
                            ref={ref}
                            hasError={Boolean(errors.close_in)}
                            placeholder="Enter Months"
                            className="w-full border-custom-border-200"
                            min={1}
                            max={12}
                          />
                          <span className="absolute right-8 top-2.5 text-sm text-custom-text-200">Months</span>
                        </div>
                      )}
                    />

                    {errors.close_in && (
                      <span className="px-1 text-sm text-red-500">Select a month between 1 and 12.</span>
                    )}
                  </>
                ) : (
                  <>
                    <Controller
                      control={control}
                      name="archive_in"
                      rules={{
                        required: "Select a month between 1 and 12.",
                        min: 1,
                        max: 12,
                      }}
                      render={({ field: { value, onChange, ref } }) => (
                        <div className="relative flex w-full flex-col justify-center gap-1">
                          <Input
                            id="archive_in"
                            name="archive_in"
                            type="number"
                            value={value?.toString()}
                            onChange={onChange}
                            ref={ref}
                            hasError={Boolean(errors.archive_in)}
                            placeholder="Enter Months"
                            className="w-full border-custom-border-200"
                            min={1}
                            max={12}
                          />
                          <span className="absolute right-8 top-2.5 text-sm text-custom-text-200">Months</span>
                        </div>
                      )}
                    />
                    {errors.archive_in && (
                      <span className="px-1 text-sm text-red-500">Select a month between 1 and 12.</span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="neutral-primary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </form>
      </Dialog.Panel>
    </Dialog>
  );
};
