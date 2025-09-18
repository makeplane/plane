import type { TCommentConfig } from "@plane/editor";
import {
  INavigationPaneExtensionComponent,
  type INavigationPaneExtension as ICoreNavigationPaneExtension,
} from "@/components/pages/navigation-pane";

// EE-specific navigation pane extension data types
export type TCommentsNavigationExtensionData = TCommentConfig & {
  selectedCommentId?: string;
  pendingComment?: {
    selection: { from: number; to: number };
    referenceText?: string;
  };
  onPendingCommentCancel?: () => void;
  onSelectedThreadConsumed?: () => void;
};

// EE Union of all possible navigation pane extension data types
export type TNavigationPaneExtensionData = {
  comments?: TCommentsNavigationExtensionData;
};

// EE Navigation pane extension configuration with comment support
export interface INavigationPaneExtension<
  T extends keyof TNavigationPaneExtensionData = keyof TNavigationPaneExtensionData,
> extends Omit<ICoreNavigationPaneExtension<TNavigationPaneExtensionData[T]>, "id" | "data" | "component"> {
  id: T;
  component: INavigationPaneExtensionComponent<TNavigationPaneExtensionData[T]>;
  data?: TNavigationPaneExtensionData[T];
}
