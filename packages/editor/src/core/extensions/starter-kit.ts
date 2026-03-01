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

import StarterKit from "@tiptap/starter-kit";

type TArgs = {
  enableHistory: boolean;
};

export const CustomStarterKitExtension = (args: TArgs) => {
  const { enableHistory } = args;

  return StarterKit.configure({
    bulletList: {
      HTMLAttributes: {
        class: "list-disc pl-7 space-y-(--list-spacing-y)",
      },
    },
    orderedList: {
      HTMLAttributes: {
        class: "list-decimal pl-7 space-y-(--list-spacing-y)",
      },
    },
    listItem: {
      HTMLAttributes: {
        class: "not-prose space-y-2",
      },
    },
    code: false,
    codeBlock: false,
    horizontalRule: false,
    blockquote: false,
    paragraph: {
      HTMLAttributes: {
        class: "editor-paragraph-block",
      },
    },
    heading: {
      HTMLAttributes: {
        class: "editor-heading-block",
      },
    },
    dropcursor: false, // Disabled - using unified column drop cursor instead
    ...(enableHistory ? {} : { history: false }),
  });
};
