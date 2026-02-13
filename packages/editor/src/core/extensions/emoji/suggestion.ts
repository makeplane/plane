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

import type { EmojiOptions, EmojiStorage } from "@tiptap/extension-emoji";
import { ReactRenderer } from "@tiptap/react";
import type { Editor } from "@tiptap/react";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// helpers
import { updateFloatingUIFloaterPosition } from "@/helpers/floating-ui";
import type { CommandListInstance } from "@/helpers/tippy";
import { DROPDOWN_NAVIGATION_KEYS } from "@/helpers/tippy";
// local imports
import { EmojisListDropdown } from "./components/emojis-list";
import type { EmojisListDropdownProps, EmojiItem } from "./components/emojis-list";
import type { ExtendedEmojiStorage } from "./emoji";

const DEFAULT_EMOJIS = ["+1", "-1", "smile", "orange_heart", "eyes"];

export const emojiSuggestion: EmojiOptions["suggestion"] = {
  items: ({ editor, query }: { editor: Editor; query: string }): EmojiItem[] => {
    const { emojis } = editor.storage.emoji as EmojiStorage;

    if (query.trim() === "") {
      const defaultEmojis = DEFAULT_EMOJIS.map((name) =>
        emojis.find((emoji) => emoji.shortcodes.includes(name) || emoji.name === name)
      )
        .filter(Boolean)
        .slice(0, 5);
      return defaultEmojis as EmojiItem[];
    }
    return emojis
      .filter(({ shortcodes, tags }) => {
        const lowerQuery = query.toLowerCase();
        return (
          shortcodes.find((shortcode: string) => shortcode.startsWith(lowerQuery)) ||
          tags.find((tag: string) => tag.startsWith(lowerQuery))
        );
      })
      .slice(0, 5) as EmojiItem[];
  },

  allowSpaces: false,

  render: () => {
    let component: ReactRenderer<CommandListInstance, EmojisListDropdownProps> | null = null;
    let cleanup: () => void = () => {};
    let editorRef: Editor | null = null;

    const handleClose = (editor?: Editor) => {
      component?.destroy();
      component = null;
      (editor || editorRef)?.commands.removeActiveDropbarExtension(CORE_EXTENSIONS.EMOJI);
      const emojiStorage = editor?.storage.emoji as ExtendedEmojiStorage;
      if (emojiStorage) {
        emojiStorage.forceOpen = false;
      }
      cleanup();
    };

    return {
      onStart: (props) => {
        editorRef = props.editor;
        const emojiStorage = props.editor.storage.emoji as ExtendedEmojiStorage;
        const forceOpen = emojiStorage.forceOpen || false;
        component = new ReactRenderer<CommandListInstance, EmojisListDropdownProps>(EmojisListDropdown, {
          props: {
            ...props,
            onClose: () => handleClose(props.editor),
            forceOpen,
          } satisfies EmojisListDropdownProps,
          editor: props.editor,
          className: "fixed z-[100]",
        });
        if (!props.clientRect || !component.element) return;
        props.editor.commands.addActiveDropbarExtension(CORE_EXTENSIONS.EMOJI);
        const element = component.element as HTMLElement;
        cleanup = updateFloatingUIFloaterPosition(props.editor, element).cleanup;
      },

      onUpdate: (props) => {
        if (!component || !component.element) return;
        const emojiStorage = props.editor.storage.emoji as ExtendedEmojiStorage;
        const forceOpen = emojiStorage.forceOpen || false;
        component.updateProps({ ...props, forceOpen });
        if (!props.clientRect) return;
        cleanup();
        cleanup = updateFloatingUIFloaterPosition(props.editor, component.element as HTMLElement).cleanup;
      },
      onKeyDown: ({ event }) => {
        if ([...DROPDOWN_NAVIGATION_KEYS, "Escape"].includes(event.key)) {
          event.preventDefault();
          event.stopPropagation();
        }

        if (event.key === "Escape") {
          handleClose();
          return true;
        }

        return component?.ref?.onKeyDown({ event }) ?? false;
      },

      onExit: ({ editor }) => {
        component?.element?.remove();
        handleClose(editor);
      },
    };
  },
};
