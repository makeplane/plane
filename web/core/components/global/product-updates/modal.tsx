import { FC, useRef } from "react";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
// editor
import { DocumentReadOnlyEditorWithRef, EditorRefApi } from "@plane/editor";
// ui
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// helpers
import { LogoSpinner } from "@/components/common";
import { ProductUpdatesFooter } from "@/components/global";
// plane web components
import { ProductUpdatesHeader } from "@/plane-web/components/global";
// services
import { InstanceService } from "@/services/instance.service";

const instanceService = new InstanceService();

export type ProductUpdatesModalProps = {
  isOpen: boolean;
  handleClose: () => void;
};

export const ProductUpdatesModal: FC<ProductUpdatesModalProps> = observer((props) => {
  const { isOpen, handleClose } = props;
  // refs
  const editorRef = useRef<EditorRefApi>(null);
  // swr
  const { data, isLoading, error } = useSWR(`INSTANCE_CHANGELOG`, () => instanceService.getInstanceChangeLog(), {
    shouldRetryOnError: false,
    revalidateIfStale: false,
    revalidateOnFocus: false,
  });

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.XXL}>
      <ProductUpdatesHeader />
      <div className="flex flex-col h-[60vh] vertical-scrollbar scrollbar-xs overflow-hidden overflow-y-scroll px-6 mx-0.5">
        {!isLoading && !!error ? (
          <div className="flex flex-col items-center justify-center w-full h-full mb-8">
            <div className="text-lg font-medium">We are having trouble fetching the updates.</div>
            <div className="text-sm text-custom-text-200">
              Please visit{" "}
              <a
                href="https://go.plane.so/p-changelog"
                target="_blank"
                className="text-sm text-custom-primary-100 font-medium hover:text-custom-primary-200 underline underline-offset-1 outline-none"
              >
                our changelogs
              </a>{" "}
              for the latest updates.
            </div>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center w-full h-full">
            <LogoSpinner />
          </div>
        ) : (
          <div className="ml-5">
            {data?.id && (
              <DocumentReadOnlyEditorWithRef
                ref={editorRef}
                disabledExtensions={[]}
                id={data.id}
                initialValue={data.description_html ?? "<p></p>"}
                containerClassName="p-0 border-none"
                mentionHandler={{
                  highlights: () => Promise.resolve([]),
                }}
                embedHandler={{
                  issue: {
                    widgetCallback: () => <></>,
                  },
                }}
                fileHandler={{
                  getAssetSrc: () => Promise.resolve(""),
                }}
              />
            )}
          </div>
        )}
      </div>
      <ProductUpdatesFooter />
    </ModalCore>
  );
});
