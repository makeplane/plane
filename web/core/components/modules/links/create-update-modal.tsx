"use client";

import { FC, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
// plane types
import type { ILinkDetails, ModuleLink } from "@plane/types";
// plane ui
import { Button, Input, ModalCore, setToast, TOAST_TYPE } from "@plane/ui";
// helpers
import { checkURLValidity } from "@/helpers/string.helper";

type Props = {
  createLink: (formData: ModuleLink) => Promise<void>;
  data?: ILinkDetails | null;
  isOpen: boolean;
  handleClose: () => void;
  updateLink: (formData: ModuleLink, linkId: string) => Promise<void>;
};

const defaultValues: ModuleLink = {
  title: "",
  url: "",
};

export const CreateUpdateModuleLinkModal: FC<Props> = (props) => {
  const { isOpen, handleClose, createLink, updateLink, data } = props;
  // form info
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    control,
    reset,
  } = useForm<ModuleLink>({
    defaultValues,
  });

  const onClose = () => {
    handleClose();
    const timeoutId = setTimeout(() => {
      reset(defaultValues);
      clearTimeout(timeoutId);
    }, 500);
  };

  const handleFormSubmit = async (formData: ModuleLink) => {
    const payload = {
      title: formData.title,
      url: formData.url,
    };

    try {
      if (!data) await createLink(payload);
      else await updateLink(payload, data.id);
      onClose();
      reset(defaultValues);

      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Link created",
        message: "The link has been created successfully.",
      });
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Link not created",
        message: error?.data?.error ?? "The link could not be created.",
      });
    }
  };

  useEffect(() => {
    if (!data) return;
    reset({
      ...defaultValues,
      ...data,
    });
  }, [data, reset]);

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose}>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <div className="space-y-5 p-5">
          <h3 className="text-xl font-medium text-custom-text-200">{data ? "Update" : "Add"} link</h3>
          <div className="mt-2 space-y-3">
            <div>
              <label htmlFor="url" className="mb-2 text-custom-text-200">
                URL
              </label>
              <Controller
                control={control}
                name="url"
                rules={{
                  required: "URL is required",
                  validate: (value) => checkURLValidity(value) || "URL is invalid",
                }}
                render={({ field: { value, onChange, ref } }) => (
                  <Input
                    id="url"
                    type="text"
                    value={value}
                    onChange={onChange}
                    ref={ref}
                    hasError={Boolean(errors.url)}
                    placeholder="Type or paste a URL"
                    className="w-full"
                  />
                )}
              />
            </div>
            <div>
              <label htmlFor="title" className="mb-2 text-custom-text-200">
                Display title
                <span className="text-[10px] block">Optional</span>
              </label>
              <Controller
                control={control}
                name="title"
                render={({ field: { value, onChange, ref } }) => (
                  <Input
                    id="title"
                    type="text"
                    value={value}
                    onChange={onChange}
                    ref={ref}
                    hasError={Boolean(errors.title)}
                    placeholder="What you'd like to see this link as"
                    className="w-full"
                  />
                )}
              />
            </div>
          </div>
        </div>
        <div className="px-5 py-4 flex items-center justify-end gap-2 border-t-[0.5px] border-custom-border-200">
          <Button variant="neutral-primary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" loading={isSubmitting}>
            {data ? (isSubmitting ? "Updating link" : "Update link") : isSubmitting ? "Adding link" : "Add link"}
          </Button>
        </div>
      </form>
    </ModalCore>
  );
};
