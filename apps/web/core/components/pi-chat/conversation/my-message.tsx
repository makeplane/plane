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
import { PiChatEditorWithRef } from "@plane/editor";
import { Loader } from "@plane/ui";
import { cn, isCommentEmpty } from "@plane/utils";
import { PreviewUploads } from "../uploads/root";

type TProps = {
  id?: string;
  isLoading?: boolean;
  message?: string;
  attachments?: string[];
};
export const MyMessage = observer(function MyMessage(props: TProps) {
  const { message, id = "", isLoading = false, attachments } = props;
  return (
    <div className="w-full flex flex-col gap-2 items-end" id={id}>
      {attachments && attachments.length > 0 && (
        <div className="flex gap-2 flex-wrap justify-end">
          {attachments.map((attachmentId) => (
            <PreviewUploads attachmentId={attachmentId} key={attachmentId} />
          ))}
        </div>
      )}
      {!isLoading && !isCommentEmpty(message) && (
        <div className={cn("px-3 py-2 pr-10 text-14 rounded-xl bg-layer-1 w-fit max-w-[75%] rounded-tr-none")}>
          {/* Message */}
          <PiChatEditorWithRef editable={false} content={message} />
        </div>
      )}
      {/* Loading */}
      {isLoading && (
        <Loader>
          <Loader.Item width="50px" height="42px" />
        </Loader>
      )}
    </div>
  );
});
