import React, { FC } from "react";
import { observer } from "mobx-react";
// plane ui
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// hooks
import useKeypress from "@/hooks/use-keypress";
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

  useKeypress("Escape", () => {
    if (isOpen) onClose();
  });

  return (
    isOpen && (
      <CustomerModalProvider>
        <ModalCore isOpen={isOpen} position={EModalPosition.TOP} width={EModalWidth.XXXL}>
          <CustomerForm data={customerDetails} handleModalClose={onClose} />
        </ModalCore>
      </CustomerModalProvider>
    )
  );
});
