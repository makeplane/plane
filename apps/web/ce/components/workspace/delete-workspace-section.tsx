import { FC, useState } from "react";
import { observer } from "mobx-react";
import { ChevronDown, ChevronUp } from "lucide-react";
// types
import { WORKSPACE_TRACKER_ELEMENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { IWorkspace } from "@plane/types";
// ui
import { Button, Collapsible } from "@plane/ui";
import { DeleteWorkspaceModal } from "./delete-workspace-modal";
// components

type TDeleteWorkspace = {
  workspace: IWorkspace | null;
};

export const DeleteWorkspaceSection: FC<TDeleteWorkspace> = observer((props) => {
  const { workspace } = props;
  // states
  const [isOpen, setIsOpen] = useState(false);
  const [deleteWorkspaceModal, setDeleteWorkspaceModal] = useState(false);
  const { t } = useTranslation();

  return (
    <>
      <DeleteWorkspaceModal
        data={workspace}
        isOpen={deleteWorkspaceModal}
        onClose={() => setDeleteWorkspaceModal(false)}
      />
      <div className="border-t border-custom-border-100">
        <div className="w-full">
          <Collapsible
            isOpen={isOpen}
            onToggle={() => setIsOpen(!isOpen)}
            className="w-full"
            buttonClassName="flex w-full items-center justify-between py-4"
            title={
              <>
                <span className="text-lg tracking-tight">
                  {t("workspace_settings.settings.general.delete_workspace")}
                </span>
                {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </>
            }
          >
            <div className="flex flex-col gap-4">
              <span className="text-base tracking-tight">
                {t("workspace_settings.settings.general.delete_workspace_description")}
              </span>
              <div>
                <Button
                  variant="danger"
                  onClick={() => setDeleteWorkspaceModal(true)}
                  data-ph-element={WORKSPACE_TRACKER_ELEMENTS.DELETE_WORKSPACE_BUTTON}
                >
                  {t("workspace_settings.settings.general.delete_btn")}
                </Button>
              </div>
            </div>
          </Collapsible>
        </div>
      </div>
    </>
  );
});
