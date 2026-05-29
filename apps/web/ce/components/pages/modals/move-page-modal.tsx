// store types
import type { TPageInstance } from "@/store/pages/base-page";

export type TMovePageModalProps = {
  isOpen: boolean;
  onClose: () => void;
  page: TPageInstance;
};

export function MovePageModal(_props: TMovePageModalProps) {
  return null;
}
