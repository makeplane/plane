/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useParams } from "next/navigation";
// react-hook-form
import { Controller, useForm } from "react-hook-form";
import { Button } from "@makeplane/propel/components/button";
import { Field } from "@makeplane/propel/components/field";
import { Input, InputGroup } from "@makeplane/propel/components/input";
import type { IProject } from "@plane/types";
// ui
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
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

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose} position={EModalPosition.CENTER} width={EModalWidth.XXL}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div>
          <h3 className="text-16 leading-6 font-medium text-primary">Customize time range</h3>
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
                        <Field name="close_in" invalid={Boolean(errors.close_in)}>
                          <InputGroup size="2xl">
                            <Input
                              size="2xl"
                              id="close_in"
                              name="close_in"
                              type="number"
                              value={value?.toString()}
                              onChange={onChange}
                              ref={ref}
                              placeholder="Enter Months"
                              min={1}
                              max={12}
                            />
                          </InputGroup>
                        </Field>
                        <span className="absolute top-2.5 right-8 text-13 text-secondary">Months</span>
                      </div>
                    )}
                  />

                  {errors.close_in && (
                    <span className="px-1 text-13 text-danger-primary">Select a month between 1 and 12.</span>
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
                        <Field name="archive_in" invalid={Boolean(errors.archive_in)}>
                          <InputGroup size="2xl">
                            <Input
                              size="2xl"
                              id="archive_in"
                              name="archive_in"
                              type="number"
                              value={value?.toString()}
                              onChange={onChange}
                              ref={ref}
                              placeholder="Enter Months"
                              min={1}
                              max={12}
                            />
                          </InputGroup>
                        </Field>
                        <span className="absolute top-2.5 right-8 text-13 text-secondary">Months</span>
                      </div>
                    )}
                  />
                  {errors.archive_in && (
                    <span className="px-1 text-13 text-danger-primary">Select a month between 1 and 12.</span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" size="md" stretch="auto" label="Cancel" onClick={onClose} />
          <Button
            variant="primary"
            size="md"
            stretch="auto"
            label={isSubmitting ? "Submitting..." : "Submit"}
            type="submit"
            loading={isSubmitting}
          />
        </div>
      </form>
    </ModalCore>
  );
}
