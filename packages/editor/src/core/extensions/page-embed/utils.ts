/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
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
import type { TPageEmbedHandler } from "@/types";
// local components
import type { PageEmbedListDropdownProps } from "./page-embed-list-dropdown";
import { PageEmbedListDropdown } from "./page-embed-list-dropdown";

export const renderPageEmbedDropdown =
  (args: Pick<TPageEmbedHandler, "searchCallback" | "onCreate">): SuggestionOptions["render"] =>
  () => {
    const { searchCallback, onCreate } = args;
    let component: ReactRenderer<CommandListInstance, PageEmbedListDropdownProps> | null = null;
    let cleanup: () => void = () => {};
    let editorRef: Editor | null = null;

    const handleClose = (editor?: Editor) => {
      component?.destroy();
      component = null;
      (editor || editorRef)?.commands.removeActiveDropbarExtension(CORE_EXTENSIONS.PAGE_EMBED);
      cleanup();
    };

    return {
      onStart: (props) => {
        if (!searchCallback) return;
        editorRef = props.editor;
        component = new ReactRenderer<CommandListInstance, PageEmbedListDropdownProps>(PageEmbedListDropdown, {
          props: {
            ...props,
            searchCallback,
            onCreate,
            onClose: () => handleClose(props.editor),
          } satisfies PageEmbedListDropdownProps,
          editor: props.editor,
          className: "fixed z-[100]",
        });
        if (!props.clientRect) return;
        props.editor.commands.addActiveDropbarExtension(CORE_EXTENSIONS.PAGE_EMBED);
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
        component?.element.remove();
        handleClose(editor);
      },
    };
  };
