import React, { FC } from "react";
import { observer } from "mobx-react";
// plane ui
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// plane web components
import { CustomerForm, CustomerModalProvider } from "@/plane-web/components/customers/customer-modal";
import { useCustomers } from "@/plane-web/hooks/store";
type Props = {
  isOpen: boolean;
  customerId?: string;
  onClose: () => void;
};
export const CreateUpdateCustomerModal: FC<Props> = observer((props) => {
  const { isOpen, customerId, onClose } = props;
  // hooks
  const { getCustomerById } = useCustomers();
  const customerDetails = customerId ? getCustomerById(customerId) : undefined;
  return (
    isOpen && (
      <CustomerModalProvider>
        <ModalCore isOpen={isOpen} handleClose={onClose} position={EModalPosition.CENTER} width={EModalWidth.XXXL}>
          <CustomerForm data={customerDetails} handleModalClose={onClose} />
        </ModalCore>
      </CustomerModalProvider>
    )
  );
});
