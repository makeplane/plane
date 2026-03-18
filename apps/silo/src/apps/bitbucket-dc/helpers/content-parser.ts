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

import { sanitizeHTMLThroughSchema } from "@plane/etl/jira-server";
import { marked } from "marked";
import TurndownService from "turndown";

export class BitbucketContentParser {
  private readonly turndown = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
  });

  markdownToHtml(markdown: string): string {
    return marked.parse(markdown, {
      async: false,
      gfm: true,
    });
  }

  sanitizeHtml(html: string): string {
    return sanitizeHTMLThroughSchema(html);
  }

  htmlToMarkdown(html: string): string {
    return this.turndown.turndown(html);
  }
}
