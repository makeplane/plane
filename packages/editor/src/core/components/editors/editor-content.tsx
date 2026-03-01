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

import { EditorContent } from "@tiptap/react";
import type { Editor } from "@tiptap/react";
import { memo, useCallback } from "react";
import type { ReactNode } from "react";

type Props = {
  className?: string;
  children?: ReactNode;
  editor: Editor | null;
  id: string;
  tabIndex?: number;
};

export const EditorContentWrapper = memo(function EditorContentWrapper(props: Props) {
  const { editor, className, children, tabIndex, id } = props;

  const handleFocus = useCallback(() => {
    editor?.chain().focus(undefined, { scrollIntoView: false }).run();
  }, [editor]);

  return (
    <div tabIndex={tabIndex} onFocus={handleFocus} className={className}>
      <EditorContent editor={editor} id={id} />
      {children}
    </div>
  );
});
