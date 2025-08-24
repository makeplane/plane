import { FC, useState } from "react";
import { observer } from "mobx-react";
// ui
import { useTranslation } from "@plane/i18n";
import { AlertModalCore, setToast, TOAST_TYPE } from "@plane/ui";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  updateOperations: {
    remove: () => Promise<void>;
  };
};

export const ProjectUpdateDeleteModal: FC<Props> = observer((props) => {
  const { isOpen, onClose, updateOperations } = props;
  // states
  const [loader, setLoader] = useState(false);
  const { t } = useTranslation();

  // handlers
  const handleClose = () => {
    onClose();
    setLoader(false);
  };

  const handleDeletion = async () => {
    setLoader(true);
    try {
      await updateOperations.remove().finally(() => handleClose());
      setToast({
        message: t("updates.delete.success.message"),
        type: TOAST_TYPE.SUCCESS,
        title: t("updates.delete.success.title"),
      });
    } catch (e) {
      setToast({
        message: t("updates.delete.error.message"),
        type: TOAST_TYPE.ERROR,
        title: t("updates.delete.error.title"),
      });
    }
  };

  return (
    <AlertModalCore
      handleClose={handleClose}
      handleSubmit={handleDeletion}
      isSubmitting={loader}
      isOpen={isOpen}
      title={t("updates.delete.title")}
      content={<>{t("updates.delete.confirmation")}</>}
    />
  );
});
