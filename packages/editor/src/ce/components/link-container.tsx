/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Editor } from "@tiptap/core";
import { LinkViewContainer } from "@/components/editors/link-view-container";

export function LinkContainer({
  editor,
  containerRef,
}: {
  editor: Editor;
  containerRef: React.RefObject<HTMLDivElement>;
}) {
  return (
    <>
      <LinkViewContainer editor={editor} containerRef={containerRef} />
    </>
  );
}
