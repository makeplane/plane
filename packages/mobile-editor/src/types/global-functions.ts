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

import type { TCommandWithPropsWithItemKey, TEditorCommands } from "@plane/editor";
import type { TEditorParams, TMemberResponse } from "@/types";

declare global {
  interface Window {
    // app.tsx
    setEditorVariant: (variant: string) => void;
    flutter_inappwebview: {
      callHandler(method: string, args?: string): Promise<unknown>;
    } | null;
    // use-editor-wrapper.ts
    resetInitialParams: (params: TEditorParams) => void;
    // use-mobile-editor.ts
    executeAction: <T extends TEditorCommands>(props: TCommandWithPropsWithItemKey<T>) => void;
    sendContent: () => string | undefined;
    undo: () => void;
    redo: () => void;
    unfocus: () => void;
    focus: () => void;
    scrollToFocus: (scrollPos: number) => void;
    setLink: (link: string, text?: string) => void | undefined;
    getSelectedNodeLink: () => string | undefined;
    getSelectedText: () => string | null | undefined;
    createSelectionAtCursorPosition: () => void;
    setEditorValue: (content: string) => void;
    insertMathEquation: (commandKey: "inline-equation" | "block-equation", latex: string) => void;
    resolveCommentMark: (commentId: string) => void;
    unresolveCommentMark: (commentId: string) => void;
    // use-editor-mention.ts
    setMembers: (members: TMemberResponse[]) => void;
    getUserId: () => void;
    // page
    updatePageAccess: (pageId: string) => Promise<void>;
  }
}
