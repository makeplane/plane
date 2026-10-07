/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useParams } from "next/navigation";
// react-hook-form
import { Controller, useForm } from "react-hook-form";
import { Button } from "@makeplane/propel/components/button";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogHeading,
  DialogMain,
  DialogTitle,
} from "@makeplane/propel/components/dialog";
import { InputField } from "@makeplane/propel/components/input-field";
import type { IProject } from "@plane/types";

// types
type Props = {
  isOpen: boolean;
  type: "auto-close" | "auto-archive";
  initialValues: Partial<IProject>;
  handleClose: () => void;
  handleChange: (formData: Partial<IProject>) => Promise<void>;
};

export function SelectMonthModal({ type, initialValues, isOpen, handleClose, handleChange }: Props) {
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

  const renderMonthField = (name: "close_in" | "archive_in") => (
    <Controller
      control={control}
      name={name}
      rules={{
        required: "Select a month between 1 and 12.",
        min: 1,
        max: 12,
      }}
      render={({ field: { value, onChange, ref } }) => (
        <InputField
          id={name}
          name={name}
          type="number"
          value={value?.toString()}
          onChange={onChange}
          ref={ref}
          size="2xl"
          orientation="vertical"
          placeholder="Enter Months"
          min={1}
          max={12}
          endIcon={<span className="text-13 text-secondary">Months</span>}
          error={errors[name] ? "Select a month between 1 and 12." : undefined}
        />
      )}
    />
  );

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
          <DialogMain>
            <DialogHeader>
              <DialogHeading>
                <DialogTitle>Customize time range</DialogTitle>
              </DialogHeading>
            </DialogHeader>
            <DialogBody>
              <div className="flex w-full flex-col justify-center">
                {type === "auto-close" ? renderMonthField("close_in") : renderMonthField("archive_in")}
              </div>
            </DialogBody>
          </DialogMain>
          <DialogActions>
            <Button variant="secondary" size="md" stretch="auto" label="Cancel" onClick={onClose} />
            <Button
              variant="primary"
              size="md"
              stretch="auto"
              type="submit"
              label={isSubmitting ? "Submitting..." : "Submit"}
              loading={isSubmitting}
            />
          </DialogActions>
        </form>
      </DialogContent>
    </Dialog>
  );
}
