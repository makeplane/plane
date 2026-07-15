/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { CommentSubmitShortcut } from "@plane/types";
import { CustomSelect } from "@plane/ui";
import { getIsMac } from "@plane/utils";
// components
import { SettingsControlItem } from "@/components/settings/control-item";
// hooks
import { useUserProfile } from "@/hooks/store/user";

const isMac = getIsMac();

const COMMENT_SUBMIT_SHORTCUT_OPTIONS: { value: CommentSubmitShortcut; label: string }[] = [
  { value: "enter", label: "Enter" },
  { value: "mod_enter", label: isMac ? "⌘ + Enter" : "Ctrl + Enter" },
];

export const CommentShortcutSelector = observer(function CommentShortcutSelector() {
  // store hooks
  const {
    data: { comment_submit_shortcut },
    updateUserProfile,
  } = useUserProfile();
  // derived values
  const selectedLabel = COMMENT_SUBMIT_SHORTCUT_OPTIONS.find((o) => o.value === comment_submit_shortcut)?.label;
  // translation
  const { t } = useTranslation();

  return (
    <SettingsControlItem
      title={t("comment_submit_shortcut.label")}
      description={t("comment_submit_shortcut.description")}
      control={
        <CustomSelect
          value={comment_submit_shortcut}
          label={selectedLabel}
          onChange={(value: CommentSubmitShortcut) => {
            updateUserProfile({ comment_submit_shortcut: value });
          }}
          buttonClassName="border border-subtle-1"
          input
          placement="bottom-end"
        >
          {COMMENT_SUBMIT_SHORTCUT_OPTIONS.map((option) => (
            <CustomSelect.Option key={option.value} value={option.value}>
              {option.label}
            </CustomSelect.Option>
          ))}
        </CustomSelect>
      }
    />
  );
});
