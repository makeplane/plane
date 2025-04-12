// store types
import { EPageStoreType } from "@/plane-web/hooks/store";
import { TPageInstance } from "@/store/pages/base-page";

export type TMovePageModalProps = {
  isOpen: boolean;
  onClose: () => void;
  page: TPageInstance;
  storeType: EPageStoreType;
};

export const MovePageModal: React.FC<TMovePageModalProps> = () => null;
