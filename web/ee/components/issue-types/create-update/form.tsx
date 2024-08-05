"use client";

import { FormEvent, useState } from "react";
// ui
import { Button, EmojiIconPicker, EmojiIconPickerTypes, Input, LayersIcon, TextArea } from "@plane/ui";
// components
import { Logo } from "@/components/common";
// helpers
import { convertHexEmojiToDecimal } from "@/helpers/emoji.helper";
// plane web types
import { TIssueType } from "@/plane-web/types";

type Props = {
  formData: Partial<TIssueType>;
  isSubmitting: boolean;
  handleFormDataChange: <T extends keyof TIssueType>(key: T, value: TIssueType[T]) => void;
  handleModalClose: () => void;
  handleFormSubmit: () => Promise<void>;
};

export const CreateOrUpdateIssueTypeForm: React.FC<Props> = (props) => {
  const { formData, isSubmitting, handleFormDataChange, handleModalClose, handleFormSubmit } = props;
  // state
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [errors, setErrors] = useState<{ name?: string }>({});

  const validateForm = (data: Partial<TIssueType>) => {
    const newErrors: { name?: string } = {};
    if (!data.name || data.name.trim() === "") {
      newErrors.name = "Name is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleIssueTypeFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (validateForm(formData)) {
      await handleFormSubmit();
    }
  };

  const handleNameChange = (value: string) => {
    handleFormDataChange("name", value);
    validateForm({ ...formData, name: value });
  };

  return (
    <form onSubmit={handleIssueTypeFormSubmit}>
      <div className="space-y-3 p-5 pb-2">
        <h3 className="text-xl font-medium text-custom-text-200">{formData.id ? "Update" : "Create"} Issue type</h3>
        <div className="flex items-start gap-2 w-full">
          <EmojiIconPicker
            isOpen={isEmojiPickerOpen}
            handleToggle={(val: boolean) => setIsEmojiPickerOpen(val)}
            className="flex items-center justify-center flex-shrink0"
            buttonClassName="flex items-center justify-center"
            label={
              <span className="grid h-10 w-10 place-items-center rounded-md bg-custom-background-80/70">
                <>
                  {formData?.logo_props?.in_use ? (
                    <Logo logo={formData?.logo_props} size={20} type="lucide" />
                  ) : (
                    <LayersIcon className="h-5 w-5 text-custom-text-300" />
                  )}
                </>
              </span>
            }
            onChange={(val) => {
              let logoValue = {};
              if (val?.type === "emoji")
                logoValue = {
                  value: convertHexEmojiToDecimal(val.value.unified),
                  url: val.value.imageUrl,
                };
              else if (val?.type === "icon") logoValue = val.value;
              handleFormDataChange("logo_props", {
                in_use: val?.type,
                [val?.type]: logoValue,
              });
              setIsEmojiPickerOpen(false);
            }}
            defaultIconColor={
              formData?.logo_props?.in_use && formData?.logo_props?.in_use === "icon"
                ? formData?.logo_props?.icon?.color
                : undefined
            }
            defaultOpen={
              formData?.logo_props?.in_use && formData?.logo_props?.in_use === "emoji"
                ? EmojiIconPickerTypes.EMOJI
                : EmojiIconPickerTypes.ICON
            }
            closeOnSelect={false}
          />
          <div className="space-y-1 flew-grow w-full">
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Give this issue type a unique name"
              className="w-full resize-none text-base"
              hasError={Boolean(errors.name)}
              tabIndex={1}
              autoFocus
            />
            {errors.name && <div className="text-red-500 text-xs">{errors.name}</div>}
          </div>
        </div>
        <div className="space-y-0.5">
          <TextArea
            id="description"
            name="description"
            value={formData.description}
            onChange={(e) => handleFormDataChange("description", e.target.value)}
            placeholder="Describe what this issue type is meant for and when it’s to be used."
            className="resize-none min-h-24 text-sm"
            tabIndex={2}
          />
        </div>
      </div>
      <div className="mx-5 py-3 flex items-center justify-end gap-2 border-t-[0.5px] border-custom-border-100">
        <div className="flex items-center justify-end gap-2">
          <Button variant="neutral-primary" size="sm" onClick={handleModalClose} tabIndex={3}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" loading={isSubmitting} tabIndex={4}>
            {formData.id ? "Update" : "Create"} Issue type
          </Button>
        </div>
      </div>
    </form>
  );
};
