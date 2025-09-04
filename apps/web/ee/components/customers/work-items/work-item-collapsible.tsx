import React, { FC, useState } from "react";
import { observer } from "mobx-react";
import { PlusIcon } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { DropdownIcon } from "@plane/propel/icons";
import { Collapsible } from "@plane/ui";
import { cn } from "@plane/utils";
import { CustomerWorkItem } from "@/plane-web/components/customers";

type TProps = {
  workspaceSlug: string;
  openWorkItemModal: () => void;
  workItemIds: string[];
  customerId: string;
  requestId: string;
  isEditable?: boolean;
};

export const RequestWorkItemsListCollapsible: FC<TProps> = observer((props) => {
  const { workItemIds, workspaceSlug, openWorkItemModal, customerId, requestId, isEditable } = props;
  // i18n
  const { t } = useTranslation();
  // states
  const [isOpen, setOpen] = useState<boolean>(false);

  return (
    <Collapsible
      title={
        <>
          <div className="flex items-center gap-2">
            <DropdownIcon
              className={cn("size-2 text-custom-text-200 hover:text-custom-text-200 duration-300", {
                "-rotate-90": !isOpen,
              })}
            />
            <div className="text-sm text-custom-text-300 font-medium">
              {t("customers.linked_work_items.label")}{" "}
              <span className="text-custom-text-400 text-sm">{workItemIds.length}</span>
            </div>
          </div>
          {isEditable && (
            <div
              className="text-custom-text-100"
              onClick={(e) => {
                e.stopPropagation();
                openWorkItemModal();
              }}
            >
              <PlusIcon className="size-4" />
            </div>
          )}
        </>
      }
      buttonClassName="flex justify-between items-center w-full"
      isOpen={isOpen}
      onToggle={() => setOpen(!isOpen)}
    >
      {workItemIds?.map((id) => (
        <CustomerWorkItem
          key={id}
          workspaceSlug={workspaceSlug}
          workItemId={id}
          customerId={customerId}
          requestId={requestId}
          isEditable={isEditable}
        />
      ))}
    </Collapsible>
  );
});
