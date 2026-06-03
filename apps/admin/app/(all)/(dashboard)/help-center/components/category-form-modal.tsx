/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Button } from "@plane/propel/button";
import { Dialog, EDialogWidth } from "@plane/propel/dialog";
import { Input } from "@plane/propel/input";
import { Tabs } from "@plane/propel/tabs";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IHelpCategory, THelpLocale } from "@plane/types";
import { useInstanceHelpCenter } from "@/hooks/store";
import { HELP_LOCALES } from "./constants";
import { IconPickerField } from "./icon-picker-field";

type Props = {
  open: boolean;
  onClose: () => void;
  editCategory?: IHelpCategory | null;
};

type LocaleNames = Record<THelpLocale, string>;

const EMPTY_NAMES: LocaleNames = { vi: "", en: "", ko: "" };

export const CategoryFormModal = observer(function CategoryFormModal({ open, onClose, editCategory }: Props) {
  const { createCategory, updateCategory } = useInstanceHelpCenter();
  const [names, setNames] = useState<LocaleNames>(EMPTY_NAMES);
  const [icon, setIcon] = useState("");
  const [color, setColor] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editCategory) {
      const next = { ...EMPTY_NAMES };
      editCategory.translations.forEach((t) => (next[t.locale] = t.name));
      setNames(next);
      setIcon(editCategory.icon);
      setColor(editCategory.color);
      setIsActive(editCategory.is_active);
    } else {
      setNames(EMPTY_NAMES);
      setIcon("");
      setColor("");
      setIsActive(true);
    }
  }, [open, editCategory]);

  const onSubmit = async () => {
    const translations = HELP_LOCALES.map((l) => ({ locale: l.value, name: names[l.value].trim() })).filter(
      (t) => t.name
    );
    if (translations.length === 0) {
      setToast({ type: TOAST_TYPE.ERROR, title: "At least one locale name is required" });
      return;
    }
    setIsSubmitting(true);
    try {
      if (editCategory) {
        await updateCategory(editCategory.id, { translations, icon, color, is_active: isActive });
        setToast({ type: TOAST_TYPE.SUCCESS, title: "Category updated" });
      } else {
        await createCategory({ translations, icon, color, is_active: isActive });
        setToast({ type: TOAST_TYPE.SUCCESS, title: "Category created" });
      }
      onClose();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Failed to save category" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()} modal>
      <Dialog.Panel width={EDialogWidth.MD}>
        <div className="p-6">
          <Dialog.Title>{editCategory ? "Edit Category" : "Add Category"}</Dialog.Title>
          <div className="mt-4 space-y-4">
            <div className="flex items-end gap-3">
              <div className="space-y-1">
                <label className="block text-13 font-medium text-primary">Icon</label>
                <IconPickerField
                  iconName={icon}
                  color={color}
                  onChange={(name, c) => {
                    setIcon(name);
                    setColor(c);
                  }}
                />
              </div>
              <label className="flex items-center gap-2 pb-2 text-13 font-medium cursor-pointer">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                Active
              </label>
            </div>
            <div>
              <Tabs defaultValue="vi">
                <Tabs.List>
                  {HELP_LOCALES.map((l) => (
                    <Tabs.Trigger key={l.value} value={l.value}>
                      {l.label}
                    </Tabs.Trigger>
                  ))}
                </Tabs.List>
                {HELP_LOCALES.map((l) => (
                  <Tabs.Content key={l.value} value={l.value} className="pt-3">
                    <Input
                      value={names[l.value]}
                      onChange={(e) => setNames((prev) => ({ ...prev, [l.value]: e.target.value }))}
                      placeholder={`Category name (${l.label})`}
                      className="w-full bg-layer-2"
                    />
                  </Tabs.Content>
                ))}
              </Tabs>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" type="button" loading={isSubmitting} onClick={() => void onSubmit()}>
              {editCategory ? "Save changes" : "Create"}
            </Button>
          </div>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
});
