import { FC } from "react";
import { observer } from "mobx-react-lite";
// ui
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// components
import { ProductUpdatesFooter } from "@/components/global";
// plane web components
import { ProductUpdatesHeader } from "@/plane-web/components/global";
import { ProductUpdatesBody } from "@/plane-web/components/global/product-updates-body";

export type ProductUpdatesModalProps = {
  isOpen: boolean;
  handleClose: () => void;
};

export const ProductUpdatesModal: FC<ProductUpdatesModalProps> = observer((props) => {
  const { isOpen, handleClose } = props;

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.XXXXL}>
      <ProductUpdatesHeader />
      <ProductUpdatesBody />
      <ProductUpdatesFooter />
    </ModalCore>
  );
});
