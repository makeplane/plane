import type { ReactNode } from "react";
import type { EPageStoreType } from "@/plane-web/hooks/store";
import type { TPageInstance } from "@/store/pages/base-page";

export interface INavigationPaneExtensionProps<T = Record<string, unknown>> {
  page: TPageInstance;
  extensionData?: T;
  storeType: EPageStoreType;
}

export interface INavigationPaneExtensionComponent<T = Record<string, unknown>> {
  (props: INavigationPaneExtensionProps<T>): ReactNode;
}

export interface INavigationPaneExtension<T = Record<string, unknown>> {
  id: string;
  triggerParam: string;
  component: INavigationPaneExtensionComponent<T>;
  data?: T;
  width?: number;
}
