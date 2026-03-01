/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { observer } from "mobx-react";
// plane ui
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// hooks
import useKeypress from "@/hooks/use-keypress";
// plane web components
import { CustomerForm, CustomerModalProvider } from "@/components/customers/customer-modal";
import { useCustomers } from "@/plane-web/hooks/store";
type Props = {
  isOpen: boolean;
  customerId?: string;
  onClose: () => void;
};
export const CreateUpdateCustomerModal = observer(function CreateUpdateCustomerModal(props: Props) {
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
        <ModalCore
          isOpen={isOpen}
          position={EModalPosition.TOP}
          width={EModalWidth.XXXL}
          className="flex flex-col min-h-0 max-h-[80vh]"
        >
          <CustomerForm data={customerDetails} handleModalClose={onClose} />
        </ModalCore>
      </CustomerModalProvider>
    )
  );
});
