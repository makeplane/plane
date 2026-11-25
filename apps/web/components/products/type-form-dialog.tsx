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
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TProductType } from "@plane/types";

type TValues = Pick<TProductType, "name" | "color">;

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (!isOpen) return;
    setName(type?.name ?? "");
    setColor(type?.color || DEFAULT_COLOR);
  }, [isOpen, type]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const isDone = await onSubmit({ name: name.trim(), color });
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
