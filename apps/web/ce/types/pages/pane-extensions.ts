import type {
  INavigationPaneExtension as ICoreNavigationPaneExtension,
  INavigationPaneExtensionComponent,
} from "@/components/pages/navigation-pane";

// EE Union/map of extension data types (keyed by extension id)
export type TNavigationPaneExtensionData = Record<string, unknown>;

// EE Navigation pane extension configuration
export interface INavigationPaneExtension<
  T extends keyof TNavigationPaneExtensionData = keyof TNavigationPaneExtensionData,
> extends Omit<ICoreNavigationPaneExtension<TNavigationPaneExtensionData[T]>, "id" | "data" | "component"> {
  id: T;
  component: INavigationPaneExtensionComponent<TNavigationPaneExtensionData[T]>;
  data?: TNavigationPaneExtensionData[T];
}
