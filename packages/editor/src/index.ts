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

// editors
export {
  CollaborativeDocumentEditorWithRef,
  DocumentEditorWithRef,
  LiteTextEditorWithRef,
  RichTextEditorWithRef,
  VersionDiffEditor,
  createColorMapping,
  getUserColor,
  createUserColor,
  YChangeTooltipContainer,
} from "@/components/editors";
export type { TVersionDiffEditorProps, TPrecomputedDiff, TUserInfo, UserColor } from "@/components/editors";

// PQL editor
export { PQLEditorWithRef } from "@/components/editors/pql/editor";
export type { PQLEditorProps, PQLEditorHandle } from "@/components/editors/pql/editor";
export type { FieldDef, ParseResult, ParseError, ASTNode, Token, ValueNode } from "@/extensions/pql-editor/types";
export { TokenKind } from "@/extensions/pql-editor/types";
export { FIELD_ALIASES } from "@/extensions/pql-editor/plugins/grammar";
export { tokenize as tokenizePQL } from "@/extensions/pql-editor/plugins/lexer";
export { parse as parsePQL } from "@/extensions/pql-editor/plugins/parser";
export { PiChatEditorWithRef } from "./ee/components/editors/pi-chat-editor/editor";

// constants
export * from "@/constants/common";

// helpers
export * from "@/helpers/common";
export * from "@/helpers/yjs-utils";
export * from "@/helpers/version-diff-utils";
export * from "@/helpers/parser";

export { CORE_EXTENSIONS } from "@/constants/extension";
export { ADDITIONAL_EXTENSIONS } from "@/plane-editor/constants/extensions";
export { EDrawioMode } from "./ee/extensions/drawio/types";

// types
export * from "@/types";

// additional exports
export { TrailingNode } from "./core/extensions/trailing-node";

// AI block exports (for widget callback pattern)
export { CustomAIBlockUI } from "./ee/extensions/ai-block/block-ui";
export type { CustomAIBlockUIProps } from "./ee/extensions/ai-block/block-ui";
export type { TAIBlockNodeViewProps, TAIBlockWidgetProps } from "./ee/extensions/ai-block/types";
export { EnterKeyExtension } from "./core/extensions/enter-key";
