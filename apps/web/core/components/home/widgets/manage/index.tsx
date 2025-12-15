import type { FC } from "react";
import { observer } from "mobx-react";
// plane types
// plane ui
import { useTranslation } from "@plane/i18n";
import { EModalWidth, ModalCore } from "@plane/ui";
import { WidgetList } from "./widget-list";

export type TProps = {
  workspaceSlug: string;
  isModalOpen: boolean;
  handleOnClose?: () => void;
};

export const ManageWidgetsModal = observer(function ManageWidgetsModal(props: TProps) {
  // props
  const { workspaceSlug, isModalOpen, handleOnClose } = props;
  const { t } = useTranslation();

  return (
    <ModalCore isOpen={isModalOpen} handleClose={handleOnClose} width={EModalWidth.MD}>
      <div className="p-4">
        <div className="font-medium text-18"> {t("home.manage_widgets")}</div>
        <WidgetList workspaceSlug={workspaceSlug} />
      </div>
    </ModalCore>
  );
});
