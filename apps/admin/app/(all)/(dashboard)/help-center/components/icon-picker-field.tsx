/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { createElement, useState } from "react";
import { BookOpen } from "lucide-react";
import { EmojiIconPickerTypes, EmojiPicker, LUCIDE_ICONS_LIST } from "@plane/propel/emoji-icon-picker";
import type { TChangeHandlerProps } from "@plane/propel/emoji-icon-picker";

// Store the lucide icon NAME string (PascalCase) — the public reader resolves it
// against this same curated list (see web category-card). Emoji picks are ignored.
const ICON_BY_NAME = new Map(LUCIDE_ICONS_LIST.map((icon) => [icon.name, icon.element]));
const resolveIcon = (name: string) => (name && ICON_BY_NAME.get(name)) || BookOpen;

type Props = {
  iconName: string;
  color: string;
  onChange: (iconName: string, color: string) => void;
};

export function IconPickerField({ iconName, color, onChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const IconElement = resolveIcon(iconName);

  return (
    <EmojiPicker
      isOpen={isOpen}
      handleToggle={setIsOpen}
      defaultOpen={EmojiIconPickerTypes.ICON}
      iconType="lucide"
      label={
        <span
          className="flex size-9 items-center justify-center rounded-md border border-subtle bg-layer-2"
          style={color ? { color } : undefined}
        >
          {createElement(IconElement, { className: "size-5" })}
        </span>
      }
      onChange={(val: TChangeHandlerProps) => {
        if (val.type === EmojiIconPickerTypes.ICON) onChange(val.value.name, val.value.color);
      }}
    />
  );
}
