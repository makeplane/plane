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

import { observer } from "mobx-react";
// plane imports
import type { EditorRefApi } from "@plane/editor";
import { cn, isCommentEmpty } from "@plane/utils";
// components
import { LiteTextEditor } from "@/components/editor/lite-text";

type TProps = {
  id?: string;
  message?: string;
  readOnlyEditorRef: React.RefObject<EditorRefApi>;
  workspaceId: string;
  workspaceSlug: string;
  projectId?: string;
};
export const Prompt = observer(function Prompt(props: TProps) {
  const { message, id = "", readOnlyEditorRef, workspaceId, workspaceSlug, projectId } = props;
  return (
    <div className="w-full flex flex-col gap-2 items-end my-4" id={id}>
      {!isCommentEmpty(message) && (
        <div className={cn("p-1 text-14 text-secondary rounded-xl bg-layer-1 w-fit max-w-[75%] rounded-tr-none")}>
          {/* Message */}
          <LiteTextEditor
            editable={false}
            ref={readOnlyEditorRef}
            id={id}
            initialValue={message ?? "<p></p>"}
            workspaceId={workspaceId}
            workspaceSlug={workspaceSlug}
            containerClassName={cn("!py-1 transition-[border-color] duration-500")}
            projectId={projectId?.toString()}
            displayConfig={{
              fontSize: "small-font",
            }}
            parentClassName="border-none"
          />
        </div>
      )}
    </div>
  );
});
