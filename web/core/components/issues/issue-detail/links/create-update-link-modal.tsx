"use client";

import { FC, useEffect } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
// plane types
import type { TIssueLinkEditableFields } from "@plane/types";
// plane ui
import { Button, Input, ModalCore } from "@plane/ui";
// hooks
import { useIssueDetail } from "@/hooks/store";
// types
import { TLinkOperations } from "./root";

export type TLinkOperationsModal = Exclude<TLinkOperations, "remove">;

export type TIssueLinkCreateFormFieldOptions = TIssueLinkEditableFields & {
  id?: string;
};

export type TIssueLinkCreateEditModal = {
  isModalOpen: boolean;
  handleOnClose?: () => void;
  linkOperations: TLinkOperationsModal;
};

const defaultValues: TIssueLinkCreateFormFieldOptions = {
  title: "",
  url: "",
};

export const IssueLinkCreateUpdateModal: FC<TIssueLinkCreateEditModal> = observer((props) => {
  // props
  const { isModalOpen, handleOnClose, linkOperations } = props;
  // react hook form
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    control,
    reset,
  } = useForm<TIssueLinkCreateFormFieldOptions>({
    defaultValues,
  });
  // store hooks
  const { issueLinkData: preloadedData, setIssueLinkData } = useIssueDetail();

  const onClose = () => {
    setIssueLinkData(null);
    if (handleOnClose) handleOnClose();
  };

  const handleFormSubmit = async (formData: TIssueLinkCreateFormFieldOptions) => {
    const parsedUrl = formData.url.startsWith("http") ? formData.url : `http://${formData.url}`;
    try {
      if (!formData || !formData.id) await linkOperations.create({ title: formData.title, url: parsedUrl });
      else await linkOperations.update(formData.id, { title: formData.title, url: parsedUrl });
      onClose();
    } catch (error) {
      console.error("error", error);
    }
  };

  useEffect(() => {
    if (isModalOpen) reset({ ...defaultValues, ...preloadedData });
  }, [preloadedData, reset, isModalOpen]);

  return (
    <ModalCore isOpen={isModalOpen} handleClose={onClose}>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <div className="space-y-5 p-5">
          <h3 className="text-xl font-medium text-custom-text-200">{preloadedData?.id ? "Update" : "Add"} link</h3>
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
              {errors.url && <span className="text-xs text-red-500">URL is invalid</span>}
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
            {preloadedData?.id ? (isSubmitting ? "Updating" : "Update") : isSubmitting ? "Adding" : "Add"} link
          </Button>
        </div>
      </form>
    </ModalCore>
  );
});
