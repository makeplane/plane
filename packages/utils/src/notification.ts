/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { stripAndTruncateHTML } from "./string";

export const sanitizeCommentForNotification = (mentionContent: string | undefined) =>
  mentionContent
    ? stripAndTruncateHTML(
        mentionContent.replace(/<mention-component\b[^>]*\blabel="([^"]*)"[^>]*><\/mention-component>/g, "$1")
      )
    : mentionContent;
