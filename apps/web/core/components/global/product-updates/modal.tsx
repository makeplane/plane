import { observer } from "mobx-react";
// ui
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// components
import { ProductUpdatesFooter } from "@/components/global";
// plane web components
import { ProductUpdatesChangelog } from "@/plane-web/components/global/product-updates/changelog";
import { ProductUpdatesHeader } from "@/plane-web/components/global/product-updates/header";

export type ProductUpdatesModalProps = {
  isOpen: boolean;
  handleClose: () => void;
};

export const ProductUpdatesModal = observer(function ProductUpdatesModal(props: ProductUpdatesModalProps) {
  const { isOpen, handleClose } = props;

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.XXXXL}>
      <ProductUpdatesHeader />
      <ProductUpdatesChangelog />
      <ProductUpdatesFooter />
    </ModalCore>
  );
});
