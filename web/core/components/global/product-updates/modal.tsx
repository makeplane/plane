import { FC } from "react";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
import { Megaphone } from "lucide-react";
// plane imports
import { ChangelogConfig } from "@plane/constants";
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

  // useSWR
  const { data, isLoading } = useSWR(
    isOpen ? `CHANGELOG_DATA_${ChangelogConfig.limit}_${ChangelogConfig.page}` : null,
    () => changelogService.fetchChangelog(ChangelogConfig.slug, ChangelogConfig.limit, ChangelogConfig.page)
  );

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.XXXXL}>
      <ProductUpdatesHeader />
      <div className="flex flex-col h-[60vh] vertical-scrollbar scrollbar-xs overflow-hidden overflow-y-scroll px-6 mx-0.5">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <LogoSpinner />
          </div>
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
