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

import type { Editor } from "@tiptap/react";
import { Columns3, MoveHorizontal, Shrink } from "lucide-react";
// types
import type { BlockMenuOption } from "./block-menu";

export const getNodeOptions = (editor: Editor): BlockMenuOption[] => [
  {
    icon: MoveHorizontal,
    key: "table-full-width",
    label: "Fit to width",
    isDisabled: !editor.can().chain().focus().setTableToFullWidth().run(),
    onClick: () => editor.chain().focus().setTableToFullWidth().run(),
  },
  {
    icon: Columns3,
    key: "equalize-columns",
    label: "Equal-size columns",
    isDisabled: !editor.can().chain().focus().equalizeColumns().run(),
    onClick: () => editor.chain().focus().equalizeColumns().run(),
  },
  {
    icon: Shrink,
    key: "fit-columns-to-text",
    label: "Fit to text",
    isDisabled: !editor.can().chain().focus().fitColumnsToText().run(),
    onClick: () => editor.chain().focus().fitColumnsToText().run(),
  },
];
