/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Editor, Range } from "@tiptap/core";
import { ReactRenderer } from "@tiptap/react";
// components
import type { PageLinkPickerOverlayProps } from "@/components/menus/page-link-picker-overlay";
import { PageLinkPickerOverlay } from "@/components/menus/page-link-picker-overlay";
// helpers
import { updateFloatingUIFloaterPosition } from "@/helpers/floating-ui";
import type { TPageLinkSearchResult } from "@/types";

type OpenPageLinkPickerArgs = {
  editor: Editor;
  range?: Range;
  searchPages: (query: string) => Promise<TPageLinkSearchResult[]>;
  buildPageLink: (pageId: string, projectId?: string) => string;
};

const noopCleanup = () => {};

export const openPageLinkPicker = ({ editor, range, searchPages, buildPageLink }: OpenPageLinkPickerArgs) => {
  if (range) {
    editor.chain().focus().deleteRange(range).run();
  }

  let component: ReactRenderer<void, PageLinkPickerOverlayProps> | null = null;
  let cleanup: () => void = noopCleanup;

  const handleClose = () => {
    component?.destroy();
    component = null;
    cleanup();
  };

  component = new ReactRenderer<void, PageLinkPickerOverlayProps>(PageLinkPickerOverlay, {
    props: {
      editor,
      searchPages,
      buildPageLink,
      onClose: handleClose,
    },
    editor,
    className: "fixed z-[100]",
  });

  const element = component.element as HTMLElement;
  cleanup = updateFloatingUIFloaterPosition(editor, element).cleanup;
};
