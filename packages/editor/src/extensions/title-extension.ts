/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { AnyExtension, Extensions } from "@tiptap/core";
import Document from "@tiptap/extension-document";
import Heading from "@tiptap/extension-heading";
import Text from "@tiptap/extension-text";

export const TitleExtensions: Extensions = [
  Document.extend({
    content: "heading",
  }),
  Heading.configure({
    levels: [1],
  }) as AnyExtension,
  Text,
];
