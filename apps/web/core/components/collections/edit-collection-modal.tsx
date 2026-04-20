/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useState } from "react";
import type { FC } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import { BookOpen } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { EmojiPicker, EmojiIconPickerTypes, Logo } from "@plane/propel/emoji-icon-picker";
import { Input } from "@plane/propel/input";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TCollectionUpdatePayload, TLogoProps } from "@plane/types";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { cn } from "@plane/utils";
import { useCollection } from "@/plane-web/hooks/store";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  collectionId: string;
  collectionName: string;
  logoProps?: TLogoProps;
};

const EditCollectionForm = ({ collectionId, collectionName, logoProps, onClose }: Omit<Props, "isOpen">) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const collectionStore = useCollection();
  const { t } = useTranslation();
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<TCollectionUpdatePayload>({
    defaultValues: {
      name: collectionName,
      logo_props: logoProps || {},
    },
    mode: "onChange",
  });

  const logoValue = watch("logo_props") as TLogoProps | undefined;
  const iconColor =
    logoValue?.in_use === "icon" ? (logoValue.icon?.background_color ?? logoValue.icon?.color) : undefined;

  const onSubmit = async (formData: TCollectionUpdatePayload) => {
    if (isSubmitting) return;

    const collection = collectionStore.getCollectionById(collectionId);
    if (!collection) return;

    setIsSubmitting(true);
    try {
      await collection.updateCollection(formData);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("common.success"),
        message: t("wiki_collections.toasts.renamed"),
      });
      onClose();
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("common.error.label"),
        message:
          (error as { detail?: string; error?: string })?.detail ??
          (error as { error?: string })?.error ??
          (error instanceof Error ? error.message : t("wiki_collections.toasts.rename_error")),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
      <div className="px-4 pt-5">
        <h3 className="text-lg font-medium text-primary">{t("wiki_collections.edit_modal.title")}</h3>
      </div>

      <div className="space-y-4 px-4 py-4">
        <div className="flex items-start gap-2">
          <EmojiPicker
            isOpen={isEmojiPickerOpen}
            handleToggle={(value: boolean) => setIsEmojiPickerOpen(value)}
            className="flex items-center justify-center flex-shrink-0"
            buttonClassName="flex items-center justify-center"
            label={
              <span
                className={cn(
                  "grid size-9 place-items-center rounded-[10px] transition-colors",
                  !iconColor && "bg-layer-2 hover:bg-layer-2-hover"
                )}
                style={{ backgroundColor: iconColor ? `${iconColor}20` : undefined }}
              >
                {logoValue?.in_use ? (
                  <Logo logo={logoValue} size={18} type="lucide" />
                ) : (
                  <BookOpen className="size-[18px] text-tertiary" />
                )}
              </span>
            }
            onChange={(value) => {
              setValue(
                "logo_props",
                value.type === "emoji"
                  ? {
                      in_use: value.type,
                      emoji: { value: value.value },
                    }
                  : {
                      in_use: value.type,
                      icon: {
                        name: value.value.name,
                        color: value.value.color,
                        background_color: value.value.color,
                      },
                    },
                {
                  shouldDirty: true,
                  shouldValidate: true,
                }
              );
              setIsEmojiPickerOpen(false);
            }}
            defaultIconColor={iconColor}
            defaultOpen={EmojiIconPickerTypes.ICON}
            showEmojiTab={false}
          />

          <div className="flex-1 space-y-1">
            <Controller
              control={control}
              name="name"
              rules={{
                required: t("wiki_collections.form.name_required"),
                maxLength: {
                  value: 255,
                  message: t("wiki_collections.form.name_max_length"),
                },
              }}
              render={({ field: { value, onChange } }) => (
                <Input
                  id="collection-name"
                  type="text"
                  value={value}
                  onChange={(event) => onChange(event.target.value)}
                  placeholder={t("wiki_collections.form.name_placeholder_edit")}
                  className="w-full"
                  hasError={!!errors.name}
                />
              )}
            />
            {errors.name && <p className="text-10 text-danger-primary">{errors.name.message}</p>}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-strong px-4 py-3">
        <Button variant="secondary" size="lg" onClick={onClose} disabled={isSubmitting} tabIndex={-1}>
          {t("common.cancel")}
        </Button>
        <Button variant="primary" size="lg" type="submit" loading={isSubmitting} disabled={!isValid || isSubmitting}>
          {t("common.save_changes")}
        </Button>
      </div>
    </form>
  );
};

export const EditCollectionModal: FC<Props> = observer(function EditCollectionModal({
  isOpen,
  onClose,
  collectionId,
  collectionName,
  logoProps,
}) {
  return (
    <ModalCore isOpen={isOpen} handleClose={onClose} position={EModalPosition.CENTER} width={EModalWidth.LG}>
      {isOpen ? (
        <EditCollectionForm
          key={`${collectionId}:${collectionName}`}
          collectionId={collectionId}
          collectionName={collectionName}
          logoProps={logoProps}
          onClose={onClose}
        />
      ) : null}
    </ModalCore>
  );
});
