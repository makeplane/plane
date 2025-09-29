import { type INavigationPaneExtension as ICoreNavigationPaneExtension } from "@/components/pages/navigation-pane";
import type { TCommentConfig } from "@plane/editor";

// EE-specific editor extension handler types
export type TCommentsEditorExtensionHandlers = TCommentConfig;

// EE-specific navigation pane extension data types
export type TCommentsNavigationExtensionData = TCommentConfig & {
  pendingComment?: {
    selection: { from: number; to: number };
    referenceText?: string;
  };
  onPendingCommentCancel?: () => void;
};

// EE Union of all possible navigation pane extension data types
export type TNavigationPaneExtensionData = {
  comments?: TCommentsNavigationExtensionData;
};

// EE Navigation pane extension configuration with comment support
export interface INavigationPaneExtension<
  T extends keyof TNavigationPaneExtensionData = keyof TNavigationPaneExtensionData,
> extends ICoreNavigationPaneExtension<TNavigationPaneExtensionData[T]> {
  id: T;
  triggerParam: string;
  component: any; // Component type from core
  data?: TNavigationPaneExtensionData[T];
  width?: number;
}
