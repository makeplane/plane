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
// ui
import { TOAST_TYPE, setToast } from "@plane/ui";
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
  const { markings } = useEditorMarkings();

  const actionCompleteAlert = ({
    title,
    message,
    type,
  }: {
    title: string;
    message: string;
    type: "success" | "error" | "warning" | "info";
  }) => {
    setToast({
      title,
      message,
      type: type as TOAST_TYPE,
    });
  };

  const { setShowAlert } = useReloadConfirmations(pageStore?.isSubmitting === "submitting");

  // auth
  const isPageReadOnly =
    is_locked || archived_at || (!!currentProjectRole && currentProjectRole <= EUserProjectRoles.VIEWER);

  return (
    <>
      {editorRef.current && (
        <div
          className={cn(
            "sticky top-0 h-full flex-shrink-0 w-56 lg:w-72 hidden md:block p-5 duration-200 -translate-x-full",
            {
              "translate-x-0": sidePeekVisible,
            }
          )}
        >
          <PageContentBrowser editorRef={editorRef.current} markings={markings} />
        </div>
      )}
      <div className="h-full w-full md:w-[calc(100%-14rem)] lg:w-[calc(100%-18rem-18rem)] pl-5 pr-5 md:pr-0">
        {isPageReadOnly ? (
          <DocumentReadOnlyEditorWithRef
            onActionCompleteHandler={actionCompleteAlert}
            ref={editorRef}
            title={pageTitle}
            value={pageDescription}
            customClassName={"tracking-tight w-full px-0"}
            borderOnFocus={false}
            noBorder
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
                onActionCompleteHandler={actionCompleteAlert}
                customClassName="tracking-tight self-center h-full w-full right-[0.675rem]"
                onChange={(_description_json, description_html) => {
                  setIsSubmitting("submitting");
                  setShowAlert(true);
                  onChange(description_html);
                  handleSubmit();
                }}
              />
            )}
          />
        )}
      </div>
      <div className="h-full w-56 lg:w-72 flex-shrink-0 hidden lg:block" />
    </>
  );
});
