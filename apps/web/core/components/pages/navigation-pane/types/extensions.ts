import { ReactNode } from "react";
import { EPageStoreType } from "@/plane-web/hooks/store";
import { TPageInstance } from "@/store/pages/base-page";

export interface INavigationPaneExtensionProps<T = any> {
  page: TPageInstance;
  extensionData?: T;
  storeType: EPageStoreType;
}

export interface INavigationPaneExtensionComponent<T = any> {
  (props: INavigationPaneExtensionProps<T>): ReactNode;
}

export interface INavigationPaneExtension<T = any> {
  id: string;
  triggerParam: string;
  component: INavigationPaneExtensionComponent<T>;
  data?: T;
  width?: number;
}
