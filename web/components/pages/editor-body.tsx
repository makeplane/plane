import { useRouter } from "next/router";
import { observer } from "mobx-react";
import { Control, Controller } from "react-hook-form";
// hooks
import { useUser, useWorkspace } from "hooks/store";
import useReloadConfirmations from "hooks/use-reload-confirmation";
// services
import { FileService } from "services/file.service";
// components
import { PageContentBrowser } from "components/pages";
// helpers
import { cn } from "helpers/common.helper";
// types
import {
  DocumentEditorWithRef,
  DocumentReadOnlyEditorWithRef,
  EditorRefApi,
  useEditorMarkings,
} from "@plane/document-editor";
import { IPageStore } from "store/page.store";
import { IPage } from "@plane/types";
// constants
import { EUserProjectRoles } from "constants/project";
import { useEffect } from "react";

// services
const fileService = new FileService();

type Props = {
  control: Control<IPage, any>;
  editorRef: React.RefObject<EditorRefApi>;
  handleSubmit: () => void;
  pageStore: IPageStore;
  sidePeekVisible: boolean;
};

export const PageEditorBody: React.FC<Props> = observer((props) => {
  const { control, editorRef, handleSubmit, pageStore, sidePeekVisible } = props;
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // store hooks
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { getWorkspaceBySlug } = useWorkspace();
  // derived values
  const workspaceId = getWorkspaceBySlug(workspaceSlug?.toString() ?? "")?.id ?? "";
  const pageTitle = pageStore?.name;
  const pageDescription = pageStore?.description_html;
  const { is_locked, archived_at, updateName, isSubmitting, setIsSubmitting } = pageStore;
  // editor markings hook
  const { markings, updateMarkings } = useEditorMarkings();

  const { setShowAlert } = useReloadConfirmations(pageStore?.isSubmitting === "submitting");

  useEffect(() => {
    updateMarkings(pageStore.description_html);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // auth
  const isPageReadOnly =
    is_locked || archived_at || (!!currentProjectRole && currentProjectRole <= EUserProjectRoles.VIEWER);

  return (
    <>
      {editorRef.current && (
        <div
          className={cn(
            "sticky top-0 hidden h-full w-56 flex-shrink-0 -translate-x-full p-5 duration-200 md:block lg:w-72",
            {
              "translate-x-0": sidePeekVisible,
            }
          )}
        >
          <PageContentBrowser editorRef={editorRef.current} markings={markings} />
        </div>
      )}
      <div className="h-full w-full pl-5 pr-5 md:w-[calc(100%-14rem)] md:pr-0 lg:w-[calc(100%-18rem-18rem)]">
        {isPageReadOnly ? (
          <DocumentReadOnlyEditorWithRef
            ref={editorRef}
            title={pageTitle}
            value={pageDescription}
            customClassName="tracking-tight w-full px-0"
          />
        ) : (
          <Controller
            name="description_html"
            control={control}
            render={({ field: { onChange } }) => (
              <DocumentEditorWithRef
                isSubmitting={isSubmitting}
                title={pageTitle}
                uploadFile={fileService.getUploadFileFunction(workspaceSlug as string, setIsSubmitting)}
                deleteFile={fileService.getDeleteImageFunction(workspaceId)}
                restoreFile={fileService.getRestoreImageFunction(workspaceId)}
                value={pageDescription}
                cancelUploadImage={fileService.cancelUpload}
                ref={editorRef}
                updatePageTitle={updateName}
                customClassName="tracking-tight self-center h-full w-full right-[0.675rem]"
                onChange={(_description_json, description_html) => {
                  setIsSubmitting("submitting");
                  setShowAlert(true);
                  onChange(description_html);
                  handleSubmit();
                  updateMarkings(description_html);
                }}
              />
            )}
          />
        )}
      </div>
      <div className="hidden h-full w-56 flex-shrink-0 lg:block lg:w-72" />
    </>
  );
});
