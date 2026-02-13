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

import { ReactRenderer } from "@tiptap/react";
import type { Editor } from "@tiptap/react";
import type { SuggestionOptions } from "@tiptap/suggestion";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// helpers
import { updateFloatingUIFloaterPosition } from "@/helpers/floating-ui";
import type { CommandListInstance } from "@/helpers/tippy";
import { DROPDOWN_NAVIGATION_KEYS } from "@/helpers/tippy";
// types
import type { TMentionHandler } from "@/types";
// local components
import type { MentionsListDropdownProps } from "./mentions-list-dropdown";
import { MentionsListDropdown } from "./mentions-list-dropdown";

export const renderMentionsDropdown =
  (args: Pick<TMentionHandler, "searchCallback">): SuggestionOptions["render"] =>
  () => {
    const { searchCallback } = args;
    let component: ReactRenderer<CommandListInstance, MentionsListDropdownProps> | null = null;
    let cleanup: () => void = () => {};
    let editorRef: Editor | null = null;

    const handleClose = (editor?: Editor) => {
      component?.destroy();
      component = null;
      (editor || editorRef)?.commands.removeActiveDropbarExtension(CORE_EXTENSIONS.MENTION);
      cleanup();
    };

    return {
      onStart: (props) => {
        if (!searchCallback) return;
        editorRef = props.editor;
        component = new ReactRenderer<CommandListInstance, MentionsListDropdownProps>(MentionsListDropdown, {
          props: {
            ...props,
            searchCallback,
            onClose: () => handleClose(props.editor),
          } satisfies MentionsListDropdownProps,
          editor: props.editor,
          className: "fixed z-[100]",
        });
        if (!props.clientRect || !component.element) return;
        props.editor.commands.addActiveDropbarExtension(CORE_EXTENSIONS.MENTION);
        const element = component.element as HTMLElement;
        cleanup = updateFloatingUIFloaterPosition(props.editor, element).cleanup;
      },
      onUpdate: (props) => {
        if (!component || !component.element) return;
        component.updateProps(props);
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
  };
