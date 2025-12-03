import { useEffect } from "react";
import { observer } from "mobx-react";
import { USER_TRACKER_ELEMENTS } from "@plane/constants";
// ui
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// components
import { ProductUpdatesFooter } from "@/components/global";
// helpers
import { captureView } from "@/helpers/event-tracker.helper";
// plane web components
import { ProductUpdatesChangelog } from "@/plane-web/components/global/product-updates/changelog";
import { ProductUpdatesHeader } from "@/plane-web/components/global/product-updates/header";

export type ProductUpdatesModalProps = {
  isOpen: boolean;
  handleClose: () => void;
};

export const ProductUpdatesModal = observer(function ProductUpdatesModal(props: ProductUpdatesModalProps) {
  const { isOpen, handleClose } = props;

  useEffect(() => {
    if (isOpen) {
      captureView({ elementName: USER_TRACKER_ELEMENTS.PRODUCT_CHANGELOG_MODAL });
    }
  }, [isOpen]);

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.XXXXL}>
      <ProductUpdatesHeader />
      <ProductUpdatesChangelog />
      <ProductUpdatesFooter />
    </ModalCore>
  );
});
