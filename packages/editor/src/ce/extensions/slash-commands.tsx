/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { LinkIcon } from "@plane/propel/icons";
// extensions
import type { TSlashCommandAdditionalOption } from "@/extensions";
// helpers
import { openPageLinkPicker } from "@/helpers/open-page-link-picker";
// types
import type { IEditorProps } from "@/types";

type Props = Pick<IEditorProps, "disabledExtensions" | "flaggedExtensions"> & {
  extendedEditorProps?: IEditorProps["extendedEditorProps"];
};

export const coreEditorAdditionalSlashCommandOptions = (props: Props): TSlashCommandAdditionalOption[] => {
  const { extendedEditorProps } = props;
  const { searchPages, buildPageLink } = extendedEditorProps ?? {};

  if (!searchPages || !buildPageLink) {
    return [];
  }

  return [
    {
      commandKey: "link",
      key: "page-link",
      title: "Page link",
      description: "Link to another page in this project.",
      searchTerms: ["page", "link", "internal", "reference"],
      icon: <LinkIcon className="size-3.5" />,
      section: "general",
      pushAfter: "divider",
      command: ({ editor, range }) => {
        openPageLinkPicker({ editor, range, searchPages, buildPageLink });
      },
    },
  ];
};
