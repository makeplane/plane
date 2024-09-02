import { FC } from "react";
import { observer } from "mobx-react";

export type ProductUpdatesModalProps = {
  isOpen: boolean;
  handleClose: () => void;
};

export const ProductUpdatesModal: FC<ProductUpdatesModalProps> = observer(() => <></>);
