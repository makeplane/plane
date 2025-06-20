import { FC } from "react";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
import { Megaphone } from "lucide-react";
// plane imports
import { ChangelogConfig } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// components
import { LogoSpinner } from "@/components/common";
import { ProductUpdatesFooter } from "@/components/global";
// plane web components
import { ProductUpdatesHeader } from "@/plane-web/components/global";
// services
import { ChangelogService } from "@/services/changelog.service";
// local components
import { RichTextNode } from "./jsxConverter";

export type ProductUpdatesModalProps = {
  isOpen: boolean;
  handleClose: () => void;
};

const changelogService = new ChangelogService();

export const ProductUpdatesModal: FC<ProductUpdatesModalProps> = observer((props) => {
  const { isOpen, handleClose } = props;
  const { t } = useTranslation();

  // useSWR
  const { data, isLoading, error } = useSWR(isOpen ? `CHANGE_LOG` : null, () =>
    changelogService.fetchChangelog(ChangelogConfig)
  );

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.XXXXL}>
      <ProductUpdatesHeader />
      <div className="flex flex-col h-[60vh] vertical-scrollbar scrollbar-xs overflow-hidden overflow-y-scroll px-6 mx-0.5">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <LogoSpinner />
          </div>
        ) : error ? (
          <>
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
          </>
        ) : (
          <>
            {data && data?.docs?.length > 0 ? (
              <div className="relative h-full mx-auto px-4 container">
                <div>
                  {data.docs.map((contentItem) => {
                    if (!contentItem.published) return null;

                    return (
                      <div key={contentItem.id} className="relative mb-20 scroll-mt-[50px] lg:scroll-mt-[64px]">
                        <div className="flex items-center gap-2 py-2 sticky top-0 z-10 bg-custom-background-100">
                          <span className="size-8 rounded-full border flex items-center justify-center">
                            <Megaphone className="size-6" />
                          </span>
                          <span className="text-neutral-text-primary text-xl font-bold">{contentItem.title}</span>
                        </div>
                        <RichTextNode id={Number(contentItem.id)} description={contentItem.description} />
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center container my-[30vh]">No data available</div>
            )}
          </>
        )}
      </div>
      <ProductUpdatesFooter />
    </ModalCore>
  );
});
