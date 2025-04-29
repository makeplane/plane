import React, { FC } from "react";
import { observer } from "mobx-react";
import { PlusIcon } from "lucide-react";
import { CustomerRequestSearch } from "@/plane-web/components/customers";
import { useCustomers } from "@/plane-web/hooks/store";

type TProps = {
  workspaceSlug: string;
  workItemId: string;
  disabled: boolean;
};

export const CustomerRequestActionButton: FC<TProps> = observer((props) => {
  const { disabled, workItemId } = props;

  const { createUpdateRequestModalId, toggleCreateUpdateRequestModal } = useCustomers();

  const handleOpenRequestForm = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!createUpdateRequestModalId) toggleCreateUpdateRequestModal(workItemId);
  };

  return (
    <div className="flex gap-2 items-center">
      <CustomerRequestSearch isWorkItemLevel />
      {/* Add new request to customer */}
      {!disabled && (
        <div onClick={handleOpenRequestForm}>
          <PlusIcon className="h-4 w-4" />
        </div>
      )}
    </div>
  );
});
