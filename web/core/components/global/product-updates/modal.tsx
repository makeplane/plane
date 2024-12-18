import { FC } from "react";
import { observer } from "mobx-react-lite";
import { useTranslation } from "@plane/i18n";
// ui
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// components
import { ProductUpdatesFooter } from "@/components/global";
// hooks
import { useInstance } from "@/hooks/store";
// plane web components
import { ProductUpdatesHeader } from "@/plane-web/components/global";

export type ProductUpdatesModalProps = {
  isOpen: boolean;
  handleClose: () => void;
};

export const ProductUpdatesModal: FC<ProductUpdatesModalProps> = observer((props) => {
  const { isOpen, handleClose } = props;
  const { t } = useTranslation();
  const { config } = useInstance();

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.XXL}>
      <ProductUpdatesHeader />
      <div className="flex flex-col h-[60vh] vertical-scrollbar scrollbar-xs overflow-hidden overflow-y-scroll px-6 mx-0.5">
        {config?.instance_changelog_url && config?.instance_changelog_url !== "" ? (
          <iframe src={config?.instance_changelog_url} className="w-full h-full" />
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full mb-8">
            <div className="text-lg font-medium">{t("we_are_having_trouble_fetching_the_updates")}</div>
            <div className="text-sm text-custom-text-200">
              {t("please_visit")}
              <a
                href="https://go.plane.so/p-changelog"
                target="_blank"
                className="text-sm text-custom-primary-100 font-medium hover:text-custom-primary-200 underline underline-offset-1 outline-none"
              >
                {t("our_changelogs")}
              </a>{" "}
              {t("for_the_latest_updates")}.
            </div>
          </div>
        )}
      </div>
      <ProductUpdatesFooter />
    </ModalCore>
  );
});
