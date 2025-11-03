// store
import type { EPageStoreType } from "@/plane-web/hooks/store";
import type { TPageInstance } from "@/store/pages/base-page";

export type TPageHeaderExtraActionsProps = {
  page: TPageInstance;
  storeType: EPageStoreType;
};

export const PageDetailsHeaderExtraActions: React.FC<TPageHeaderExtraActionsProps> = () => null;
