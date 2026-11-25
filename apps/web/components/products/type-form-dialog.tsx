/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
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
import { CubeOutline } from "@makeplane/propel/icons";
// plane imports
import { EmojiPicker, Logo } from "@plane/blocks/emoji-icon-picker";
import { useTranslation } from "@plane/i18n";
import type { TLogoProps, TProductType } from "@plane/types";

type TValues = Pick<TProductType, "name" | "color" | "logo_props">;

type Props = {
  isOpen: boolean;
  type?: TProductType;
  onClose: () => void;
  /** Resolves to whether the dialog may close. */
  onSubmit: (values: TValues) => Promise<boolean>;
};

const DEFAULT_COLOR = "#6b7280";

export function ProductTypeFormDialog(props: Props) {
  const { isOpen, type, onClose, onSubmit } = props;
  const [name, setName] = useState("");
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [logo, setLogo] = useState<TLogoProps | undefined>(undefined);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (!isOpen) return;
    setName(type?.name ?? "");
    setColor(type?.color || DEFAULT_COLOR);
    setLogo(type?.logo_props?.in_use ? type.logo_props : undefined);
  }, [isOpen, type]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const isDone = await onSubmit({ name: name.trim(), color, logo_props: logo ?? ({} as TLogoProps) });
    setIsSubmitting(false);
    if (isDone) onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="md">
        <DialogMain>
          <DialogHeader>
            <DialogHeading>
              <DialogTitle>{type ? t("product.edit_type") : t("product.create_type")}</DialogTitle>
            </DialogHeading>
          </DialogHeader>
          <DialogBody tabIndex={0}>
            <div className="space-y-5">
              <InputField
                size="lg"
                orientation="vertical"
                label={t("name")}
                required
                type="text"
                name="name"
                maxLength={255}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              <div className="flex items-center gap-2 text-body-xs-medium text-secondary">
                {t("product.icon")}
                <EmojiPicker
                  iconType="lucide"
                  isOpen={isPickerOpen}
                  handleToggle={setIsPickerOpen}
                  buttonClassName="flex items-center justify-center"
                  label={
                    <span
                      className="grid size-(--control-height-lg) place-items-center rounded-md bg-layer-1"
                      aria-label={t("product.icon")}
                    >
                      {logo?.in_use ? (
                        <Logo logo={logo} size={18} type="lucide" />
                      ) : (
                        <CubeOutline className="size-4 text-tertiary" />
                      )}
                    </span>
                  }
                  // oxlint-disable-next-line typescript/no-explicit-any -- the picker's own type is loose
                  onChange={(picked: any) => {
                    if (picked?.type === "emoji")
                      setLogo({ in_use: "emoji", emoji: { value: picked.value } } as TLogoProps);
                    else if (picked?.type === "icon") setLogo({ in_use: "icon", icon: picked.value } as TLogoProps);
                    setIsPickerOpen(false);
                  }}
                />
              </div>
              <label className="flex items-center gap-2 text-body-xs-medium text-secondary">
                {t("product.color")}
                <input type="color" value={color} onChange={(event) => setColor(event.target.value)} />
              </label>
            </div>
          </DialogBody>
        </DialogMain>
        <DialogActions>
          <Button variant="secondary" size="md" stretch="auto" onClick={onClose} label={t("cancel")} />
          <Button
            variant="primary"
            size="md"
            stretch="auto"
            loading={isSubmitting}
            disabled={!name.trim()}
            onClick={() => void handleSubmit()}
            label={t("save")}
          />
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}
