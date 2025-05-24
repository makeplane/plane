"use client";

import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { RESTRICTED_WORK_ITEM_TYPES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TIssueType } from "@plane/types";
import { Button, Input, TextArea } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// plane web components
import { IssueTypeIconPicker } from "@/plane-web/components/issue-types";

type Props = {
  formData: Partial<TIssueType>;
  isSubmitting: boolean;
  handleFormDataChange: <T extends keyof TIssueType>(key: T, value: TIssueType[T]) => void;
  handleModalClose: () => void;
  handleFormSubmit: () => Promise<void>;
};

export const CreateOrUpdateIssueTypeForm: React.FC<Props> = observer((props) => {
  const { formData, isSubmitting, handleFormDataChange, handleModalClose, handleFormSubmit } = props;
  // state
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [errors, setErrors] = useState<{ name?: string }>({});
  // plane hooks
  const { t } = useTranslation();

  const validateForm = (data: Partial<TIssueType>) => {
    const newErrors: { name?: string } = {};
    if (!data.name || data.name.trim() === "") {
      newErrors.name = t("common.errors.entity_required", { entity: t("common.name") });
    }
    if (data.name && RESTRICTED_WORK_ITEM_TYPES.includes(data.name.toLowerCase())) {
      newErrors.name = t("common.errors.restricted_entity", { entity: t("common.name") });
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleIssueTypeFormSubmit = async (
    e: React.MouseEvent<HTMLButtonElement> | React.FormEvent<HTMLFormElement>
  ) => {
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
        <h3 className="text-xl font-medium text-custom-text-200">
          {formData.id ? t("work_item_types.update.title") : t("work_item_types.create.title")}
        </h3>
        <div className={cn("flex items-center gap-2 w-full", errors.name && "items-start")}>
          <IssueTypeIconPicker
            isOpen={isEmojiPickerOpen}
            handleToggle={(val: boolean) => setIsEmojiPickerOpen(val)}
            icon_props={formData?.logo_props?.icon}
            isDefaultIssueType={!!formData?.is_default}
            className="flex items-center justify-center flex-shrink-0"
            iconContainerClassName="flex items-center justify-center"
            onChange={(value) => {
              handleFormDataChange("logo_props", {
                in_use: "icon",
                icon: value,
              });
            }}
            size="xl"
          />
          <div className="space-y-1 flew-grow w-full">
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder={t("work_item_types.create_update.form.name.placeholder")}
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
            placeholder={t("work_item_types.create_update.form.description.placeholder")}
            className="resize-none min-h-24 text-sm"
            tabIndex={2}
          />
        </div>
      </div>
      <div className="mx-5 py-3 flex items-center justify-end gap-2 border-t-[0.5px] border-custom-border-100">
        <div className="flex items-center justify-end gap-2">
          <Button variant="neutral-primary" size="sm" onClick={handleModalClose} tabIndex={3}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="primary"
            type="submit"
            size="sm"
            onClick={handleIssueTypeFormSubmit}
            loading={isSubmitting}
            tabIndex={4}
          >
            {formData.id ? t("work_item_types.update.button") : t("work_item_types.create.button")}
          </Button>
        </div>
      </div>
    </form>
  );
});
