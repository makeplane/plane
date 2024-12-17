// store types
import { IPage } from "@/store/pages/page";

export type TMovePageModalProps = {
  isOpen: boolean;
  onClose: () => void;
  page: IPage;
};

export const MovePageModal: React.FC<TMovePageModalProps> = () => null;
