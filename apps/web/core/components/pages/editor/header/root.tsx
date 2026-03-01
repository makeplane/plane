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

import { useState } from "react";
import { observer } from "mobx-react";
import { SmilePlus } from "lucide-react";
// plane imports
import type { EditorTitleRefApi } from "@plane/editor";
import { EmojiPicker, EmojiIconPickerTypes } from "@plane/propel/emoji-icon-picker";
import { cn } from "@plane/utils";
// plane web components
import { PageTemplatePicker } from "@/plane-web/components/pages";
// store
import type { TPageInstance } from "@/store/pages/base-page";
// local imports
import { PageEditorHeaderLogoPicker } from "./logo-picker";

type Props = {
  isEditorContentEmpty: boolean;
  isPageLoading: boolean;
  page: TPageInstance;
  projectId?: string;
  titleEditorRef: React.RefObject<EditorTitleRefApi>;
  workspaceSlug: string;
};

export const PageEditorHeaderRoot = observer(function PageEditorHeaderRoot(props: Props) {
  const { isEditorContentEmpty, isPageLoading, page, projectId, titleEditorRef, workspaceSlug } = props;
  // states
  const [isLogoPickerOpen, setIsLogoPickerOpen] = useState(false);
  // derived values
  const { isContentEditable, logo_props, updatePageLogo } = page;
  const isLogoSelected = !!logo_props?.in_use;

  return (
    <>
      <div
        className={cn("h-0 flex items-end text-left", {
          "h-[48px]": isEditorContentEmpty || !isLogoSelected,
        })}
      >
        <div
          className={cn(
            "opacity-0 group-hover/page-header:opacity-100 flex items-center gap-1 transition-all duration-200",
            {
              "opacity-100": isEditorContentEmpty,
            }
          )}
        >
          {!isLogoSelected && (
            <EmojiPicker
              isOpen={isLogoPickerOpen}
              handleToggle={(val) => setIsLogoPickerOpen(val)}
              className="flex items-center justify-center"
              buttonClassName="flex items-center justify-center"
              label={
                <button
                  type="button"
                  className={cn(
                    "flex items-center gap-1 p-1 rounded-sm font-medium text-13 hover:bg-layer-1 text-tertiary outline-none transition-colors",
                    {
                      "bg-layer-1": isLogoPickerOpen,
                    }
                  )}
                >
                  <SmilePlus className="flex-shrink-0 size-4" />
                  Icon
                </button>
              }
              onChange={updatePageLogo}
              defaultIconColor={
                logo_props?.in_use && logo_props.in_use === "icon" ? logo_props?.icon?.color : undefined
              }
              defaultOpen={
                logo_props?.in_use && logo_props?.in_use === "emoji"
                  ? EmojiIconPickerTypes.EMOJI
                  : EmojiIconPickerTypes.ICON
              }
              disabled={!isContentEditable}
            />
          )}
          {isEditorContentEmpty && (
            <PageTemplatePicker
              isPageLoading={isPageLoading}
              page={page}
              projectId={projectId}
              titleEditorRef={titleEditorRef}
              workspaceSlug={workspaceSlug}
            />
          )}
        </div>
      </div>
      <PageEditorHeaderLogoPicker className="flex-shrink-0 w-full mt-2 flex" page={page} />
    </>
  );
});
