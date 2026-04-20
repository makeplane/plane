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

import { useEffect, useState } from "react";
import type { FC } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import { BookOpen } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { EmojiPicker, EmojiIconPickerTypes, Logo } from "@plane/propel/emoji-icon-picker";
import { Input } from "@plane/propel/input";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TCollectionCreatePayload, TLogoProps } from "@plane/types";
import { ECollectionAccess } from "@plane/types";
import { EModalPosition, EModalWidth, ModalCore, getRandomIconName } from "@plane/ui";
import { cn, getRandomBackgroundColor } from "@plane/utils";
import { useCollection } from "@/plane-web/hooks/store";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  workspaceSlug: string;
};

const getDefaultValues = (): TCollectionCreatePayload => {
  const color = getRandomBackgroundColor();

  return {
    name: "",
    access: ECollectionAccess.PUBLIC,
    logo_props: {
      in_use: "icon",
      icon: {
        name: getRandomIconName(),
        color,
        background_color: color,
      },
    },
  };
};

export const CreateCollectionModal: FC<Props> = observer(function CreateCollectionModal({
  isOpen,
  onClose,
  workspaceSlug,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const collectionStore = useCollection();
  const { t } = useTranslation();
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<TCollectionCreatePayload>({
    defaultValues: getDefaultValues(),
    mode: "onChange",
  });

  const logoValue = watch("logo_props") as TLogoProps | undefined;
  const iconColor =
    logoValue?.in_use === "icon" ? (logoValue.icon?.background_color ?? logoValue.icon?.color) : undefined;

  useEffect(() => {
    if (!isOpen) return;

    reset(getDefaultValues());
  }, [isOpen, reset]);

  const handleClose = () => {
    reset(getDefaultValues());
    onClose();
  };

  const onSubmit = async (formData: TCollectionCreatePayload) => {
    if (!workspaceSlug || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await collectionStore.createCollection(workspaceSlug, formData);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("common.success"),
        message: t("wiki_collections.toasts.created"),
      });
      handleClose();
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("common.error.label"),
        message:
          (error as { detail?: string; error?: string })?.detail ??
          (error as { error?: string })?.error ??
          (error instanceof Error ? error.message : t("wiki_collections.toasts.create_error")),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.LG}>
      <form onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
        <div className="px-4 pt-5">
          <h3 className="text-lg font-medium text-primary">{t("wiki_collections.create_modal.title")}</h3>
        </div>

        <div className="space-y-4 px-4 py-2">
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

            <div className="mb-2.5 flex-1 space-y-1">
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
                    placeholder={t("wiki_collections.form.name_placeholder_create")}
                    className="w-full"
                    hasError={!!errors.name}
                  />
                )}
              />
              {errors.name && <p className="text-10 text-danger-primary">{errors.name.message}</p>}
            </div>
          </div>

          {/* <div>
            <div className="text-caption-md-medium text-placeholder">Visibility</div>
            <Controller
              control={control}
              name="access"
              render={({ field: { value, onChange } }) => (
                <div>
                  <label
                    htmlFor="access-public"
                    aria-label="Open collection access"
                    className="flex cursor-pointer items-start gap-3 rounded-md p-2"
                  >
                    <input
                      id="access-public"
                      type="radio"
                      name="collection-access"
                      value={ECollectionAccess.PUBLIC}
                      checked={value === ECollectionAccess.PUBLIC}
                      onChange={() => onChange(ECollectionAccess.PUBLIC)}
                      className="mt-0.5 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="text-body-sm-regular">Open</div>
                      <div className="text-body-xs-regular text-tertiary">
                        Everyone in your workspace can access this collection
                      </div>
                    </div>
                  </label>

                  <label
                    htmlFor="access-private"
                    aria-label="Private collection access"
                    className="flex cursor-pointer items-start gap-3 rounded-md p-2"
                  >
                    <input
                      id="access-private"
                      type="radio"
                      name="collection-access"
                      value={ECollectionAccess.PRIVATE}
                      checked={value === ECollectionAccess.PRIVATE}
                      onChange={() => onChange(ECollectionAccess.PRIVATE)}
                      className="mt-0.5 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="text-body-sm-regular">Private</div>
                      <div className="text-body-xs-regular text-tertiary">
                        Only workspace admins and the collection owner can update or delete it
                      </div>
                    </div>
                  </label>
                </div>
              )}
            />
          </div> */}
        </div>

        <div className="flex justify-end gap-2 border-t border-strong px-4 py-3">
          <Button variant="secondary" size="lg" onClick={handleClose} disabled={isSubmitting} tabIndex={-1}>
            {t("common.cancel")}
          </Button>
          <Button variant="primary" size="lg" type="submit" loading={isSubmitting} disabled={!isValid || isSubmitting}>
            {t("wiki_collections.create_modal.submit")}
          </Button>
        </div>
      </form>
    </ModalCore>
  );
});
