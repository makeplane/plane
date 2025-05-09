import { useRef, useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { CustomMenu } from "@plane/ui";
import { cn } from "@plane/utils";
import { ProjectUpdateDeleteModal } from "./delete-update-modal";

type TProps = {
  updateId: string;
  operations: {
    update: () => void;
    remove: () => Promise<void>;
  };
  deleteModalId: string | null;
  allowEdit?: boolean;
  allowDelete?: boolean;
  setDeleteModalId: (updateId: string | null) => void;
};
export const UpdateQuickActions = (props: TProps) => {
  const { operations, updateId, setDeleteModalId, deleteModalId, allowEdit = true, allowDelete = true } = props;
  const [isMenuActive, setIsMenuActive] = useState(false);
  const { t } = useTranslation();
  const actionSectionRef = useRef(null);

  if (!allowEdit && !allowDelete) return null;
  return (
    <>
      <ProjectUpdateDeleteModal
        isOpen={deleteModalId === updateId}
        onClose={() => setDeleteModalId(null)}
        updateOperations={operations}
      />
      <CustomMenu
        customButton={
          <span
            ref={actionSectionRef}
            className="grid place-items-center p-0.5 text-custom-sidebar-text-400 hover:bg-custom-sidebar-background-80 rounded my-auto"
            onClick={() => {
              setIsMenuActive(!isMenuActive);
            }}
          >
            <MoreHorizontal className="size-4" />
          </span>
        }
        className={cn("h-full flex items-center opacity-100 z-20 flex-shrink-0 pointer-events-auto my-auto")}
        customButtonClassName="grid place-items-center"
        placement="bottom-start"
      >
        {allowEdit && (
          <CustomMenu.MenuItem onClick={() => operations.update()}>
            <button className="flex items-center justify-start gap-2">
              <Pencil className="h-3.5 w-3.5 stroke-[1.5]" />
              <span>{t("edit")}</span>
            </button>
          </CustomMenu.MenuItem>
        )}
        {allowDelete && (
          <CustomMenu.MenuItem onClick={() => setDeleteModalId(updateId)}>
            <button className="flex items-center justify-start gap-2">
              <Trash2 className="h-3.5 w-3.5 stroke-[1.5]" />
              <span>{t("delete")}</span>
            </button>
          </CustomMenu.MenuItem>
        )}
      </CustomMenu>
    </>
  );
};
