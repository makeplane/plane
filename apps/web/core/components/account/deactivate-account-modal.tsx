import { useState } from "react";
import { useTranslation } from "@plane/i18n";
// ui
import { Button } from "@plane/propel/button";
import { TrashIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// hooks
import { useUser } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function DeactivateAccountModal(props: Props) {
  const router = useAppRouter();
  const { isOpen, onClose } = props;
  // hooks
  const { t } = useTranslation();
  const { deactivateAccount, signOut } = useUser();

  // states
  const [isDeactivating, setIsDeactivating] = useState(false);

  const handleClose = () => {
    setIsDeactivating(false);
    onClose();
  };

  const handleDeleteAccount = async () => {
    setIsDeactivating(true);

    await deactivateAccount()
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Account deactivated successfully.",
        });
        signOut();
        router.push("/");
        handleClose();
        return;
      })
      .catch((err: any) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: err?.error,
        });
      })
      .finally(() => setIsDeactivating(false));
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.XXL}>
      <div className="px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
        <div className="">
          <div className="flex items-start gap-x-4">
            <div className="mt-3 grid place-items-center rounded-full bg-danger-subtle p-2 sm:mt-3 sm:p-2 md:mt-0 md:p-4 lg:mt-0 lg:p-4 ">
              <TrashIcon
                className="h-4 w-4 text-danger-primary sm:h-4 sm:w-4 md:h-6 md:w-6 lg:h-6 lg:w-6"
                aria-hidden="true"
              />
            </div>
            <div>
              <h3 className="my-4 text-20 font-medium leading-6 text-primary">{t("deactivate_your_account")}</h3>
              <p className="mt-6 list-disc pr-4 text-14 font-regular text-secondary">
                {t("deactivate_your_account_description")}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="mb-2 flex items-center justify-end gap-2 p-4 sm:px-6">
        <Button variant="secondary" size="lg" onClick={handleClose}>
          {t("cancel")}
        </Button>
        <Button variant="error-fill" size="lg" onClick={handleDeleteAccount}>
          {isDeactivating ? t("deactivating") : t("confirm")}
        </Button>
      </div>
    </ModalCore>
  );
}
