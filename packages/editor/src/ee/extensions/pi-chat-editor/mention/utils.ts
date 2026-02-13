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
import type { SuggestionOptions } from "@tiptap/suggestion";
// helpers
import { updateFloatingUIFloaterPosition } from "@/helpers/floating-ui";
import type { CommandListInstance } from "@/helpers/tippy";
// local components
import type { PiChatEditorMentionsDropdownProps } from "./mentions-list-dropdown";
import { PiChatEditorMentionsDropdown } from "./mentions-list-dropdown";
import type { PiChatMentionSearchCallbackResponse } from "./types";

type TArgs = {
  searchCallback?: (query: string) => Promise<PiChatMentionSearchCallbackResponse>;
};

export const renderPiChatEditorMentionsDropdown =
  (args: TArgs): SuggestionOptions["render"] =>
  () => {
    const { searchCallback } = args;
    let component: ReactRenderer<CommandListInstance, PiChatEditorMentionsDropdownProps> | null = null;
    let cleanup: () => void = () => {};

    const handleClose = () => {
      component?.destroy();
      component = null;
      cleanup();
    };

    return {
      onStart: (props) => {
        if (!searchCallback || !props.clientRect) return;
        component = new ReactRenderer<CommandListInstance, PiChatEditorMentionsDropdownProps>(
          PiChatEditorMentionsDropdown,
          {
            props: {
              ...props,
              searchCallback,
              onClose: handleClose,
            } satisfies PiChatEditorMentionsDropdownProps,
            editor: props.editor,
            className: "fixed z-[100]",
          }
        );
        if (!component.element) return;
        const element = component.element as HTMLElement;
        cleanup = updateFloatingUIFloaterPosition(props.editor, element).cleanup;
      },

      onUpdate: (props) => {
        if (!component || !component.element) return;
        component.updateProps(props);
        if (!props.clientRect) return;
        const element = component.element as HTMLElement;
        cleanup();
        cleanup = updateFloatingUIFloaterPosition(props.editor, element).cleanup;
      },

      onKeyDown({ event }) {
        if (event.key === "Escape") {
          handleClose();
          return true;
        }

        const navigationKeys = ["ArrowUp", "ArrowDown", "Enter"];
        if (navigationKeys.includes(event.key)) {
          event?.stopPropagation();
        }

        return component?.ref?.onKeyDown({ event }) ?? false;
      },
      onExit: () => {
        component?.element?.remove();
        handleClose();
      },
    };
  };
