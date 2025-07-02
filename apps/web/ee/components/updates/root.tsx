import { FC, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Plus } from "lucide-react";
// plane package imports
import { E_SORT_ORDER } from "@plane/constants";
import { useLocalStorage } from "@plane/hooks";
import { useTranslation } from "@plane/i18n";
import { EUpdateEntityType, TUpdate, TUpdateOperations } from "@plane/types";
import { Loader, setToast, TOAST_TYPE } from "@plane/ui";
// components
import { ActivitySortRoot } from "@/components/issues";
import { useUpdateDetail } from "@/plane-web/hooks/use-update-detail";
import { UpdateBlock } from "./block";
import { EmptyUpdates } from "./empty";
import { NewUpdate } from "./new-update";

type TProps = {
  entityType: EUpdateEntityType;
  entityId: string;
  allowNew?: boolean;
  handleUpdateOperations: TUpdateOperations;
  customTitle?: (updateData: TUpdate) => React.ReactNode;
};

export const UpdatesWrapper: FC<TProps> = observer(
  ({ entityType, entityId, allowNew = true, handleUpdateOperations, customTitle }) => {
    const { workspaceSlug } = useParams();
    // state
    const [showInput, setShowInput] = useState(false);
    const { storedValue: sortOrder, setValue: setSortOrder } = useLocalStorage<E_SORT_ORDER>(
      `${entityType}_updates_sort_order`,
      E_SORT_ORDER.ASC
    );
    // hooks
    const { getUpdatesByEntityId, loader } = useUpdateDetail(entityType);
    const { t } = useTranslation();

    // derived
    const updates = getUpdatesByEntityId(entityId.toString()) ?? [];

    // handler
    const toggleSortOrder = () => {
      setSortOrder(sortOrder === E_SORT_ORDER.ASC ? E_SORT_ORDER.DESC : E_SORT_ORDER.ASC);
    };

    const handleNewUpdate = async (data: Partial<TUpdate>) => {
      try {
        await handleUpdateOperations.createUpdate(data);
        setShowInput(false);
        setToast({
          message: t("updates.create.success.message"),
          type: TOAST_TYPE.SUCCESS,
          title: t("updates.create.success.title"),
        });
      } catch (error) {
        setToast({
          message: t("updates.create.error.message"),
          type: TOAST_TYPE.ERROR,
          title: t("updates.create.error.title"),
        });
        console.error("error", error);
      }
    };

    const sortedUpdates = useMemo(
      () => (sortOrder === E_SORT_ORDER.ASC ? [...updates].reverse() : updates),
      [sortOrder, updates]
    );

    return loader ? (
      <Loader className="flex flex-col gap-4 py-4">
        <Loader.Item height="125px" width="100%" />
        <Loader.Item height="125px" width="100%" />
        <Loader.Item height="125px" width="100%" />
      </Loader>
    ) : (
      <>
        {/* New Update */}
        {showInput && allowNew && <NewUpdate handleClose={() => setShowInput(false)} handleCreate={handleNewUpdate} />}

        {/* No Updates */}
        {!showInput && updates.length === 0 && (
          <EmptyUpdates handleNewUpdate={() => setShowInput(true)} allowNew={allowNew} />
        )}

        {/* Add update */}
        {!showInput && updates.length !== 0 && allowNew && (
          <div className="flex justify-between h-7 items-center">
            <button
              className="flex text-custom-primary-100 text-sm font-medium rounded w-fit py-1 px-2"
              onClick={() => setShowInput(true)}
            >
              <Plus size={15} className="my-auto mr-1" />
              <div>{t("updates.add_update")}</div>
            </button>
            <ActivitySortRoot
              sortOrder={sortOrder ?? E_SORT_ORDER.ASC}
              toggleSort={toggleSortOrder}
              className="flex-shrink-0"
              iconClassName="size-3"
            />
          </div>
        )}

        {/* Updates */}
        {sortedUpdates.length > 0 && (
          <div className="flex flex-col gap-3 pb-20">
            {sortedUpdates.map((updateId) => (
              <UpdateBlock
                updateId={updateId}
                key={updateId}
                workspaceSlug={workspaceSlug.toString()}
                entityId={entityId.toString()}
                handleUpdateOperations={handleUpdateOperations}
                entityType={entityType}
                customTitle={customTitle}
              />
            ))}
          </div>
        )}
      </>
    );
  }
);
