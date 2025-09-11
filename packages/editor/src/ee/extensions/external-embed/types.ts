import type { Node as ProseMirrorNode } from "@tiptap/core";
import type { Range } from "@tiptap/react";
import { EExternalEmbedAttributeNames, ExternalEmbedNodeViewProps } from "@/plane-editor/types/external-embed";

// Extension-specific Types
export type ExternalEmbedProps = {
  widgetCallback: (props: ExternalEmbedNodeViewProps) => React.ReactNode;
  isFlagged: boolean;
  onClick?: () => void;
};

export type InsertExternalEmbedCommandProps = {
  [EExternalEmbedAttributeNames.IS_RICH_CARD]: boolean;
  [EExternalEmbedAttributeNames.SOURCE]?: string;
  pos?: number | Range;
};

export type ExternalEmbedExtensionOptions = {
  externalEmbedCallbackComponent: (props: ExternalEmbedNodeViewProps) => React.ReactNode;
  isFlagged: boolean;
  onClick?: () => void;
};

export type ExternalEmbedExtensionStorage = {
  posToInsert: { from: number; to: number };
  url: string;
  openInput: boolean;
  isPasteDialogOpen: boolean;
};

export type ExternalEmbedExtension = ProseMirrorNode<ExternalEmbedExtensionOptions, ExternalEmbedExtensionStorage>;
