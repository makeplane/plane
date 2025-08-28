import { type INavigationPaneExtension as ICoreNavigationPaneExtension } from "@/components/pages/navigation-pane";

// EE Union of all possible navigation pane extension data types
export type TNavigationPaneExtensionData = unknown;

// EE Navigation pane extension configuration with comment support
export interface INavigationPaneExtension<
  T extends keyof TNavigationPaneExtensionData = keyof TNavigationPaneExtensionData,
> extends ICoreNavigationPaneExtension<TNavigationPaneExtensionData[T]> {
  id: T;
  triggerParam: string;
  component: any;
  data?: TNavigationPaneExtensionData[T];
  width?: number;
}
