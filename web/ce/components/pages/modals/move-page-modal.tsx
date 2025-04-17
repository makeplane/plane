// store types
import { TPageInstance } from "@/store/pages/base-page";

export type TMovePageModalProps = {
  isOpen: boolean;
  onClose: () => void;
  page: TPageInstance;
};

export const MovePageModal: React.FC<TMovePageModalProps> = () => null;
