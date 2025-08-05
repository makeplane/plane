import { FC, useEffect } from "react";
import { observer } from "mobx-react";
import { USER_TRACKER_ELEMENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// ui
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// components
import { ProductUpdatesFooter } from "@/components/global";
// helpers
import { captureView } from "@/helpers/event-tracker.helper";
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

  useEffect(() => {
    if (isOpen) {
      captureView({ elementName: USER_TRACKER_ELEMENTS.PRODUCT_CHANGELOG_MODAL });
    }
  }, [isOpen]);

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.XXXXL}>
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
                data-ph-element={USER_TRACKER_ELEMENTS.CHANGELOG_REDIRECTED}
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
