import { FC, useState, useRef, useEffect } from "react";

import { Controller, useForm } from "react-hook-form";
// components
import { GptAssistantPopover } from "components/core";
import { IssuePeekOverview } from "components/issues";
// ui
import { Spinner, StateGroupIcon } from "@plane/ui";
// hooks
import useToast from "hooks/use-toast";
import useReloadConfirmations from "hooks/use-reload-confirmation";
import { useApplication, usePage, useProjectPages, useUser, useWorkspace } from "hooks/store";
// ui
import { DocumentEditorWithRef, DocumentReadOnlyEditorWithRef } from "@plane/document-editor";
// types
import { IPage } from "@plane/types";
// constants
import { EUserProjectRoles } from "constants/project";
// services
import { FileService } from "services/file.service";
const fileService = new FileService();

export type PageDetailsViewProps = {
  workspaceSlug: string;
  projectId: string;
  pageId: string;
};

export const PageDetailsView: FC<PageDetailsViewProps> = (props) => {
  const { workspaceSlug, projectId, pageId } = props;
  // states
  const [gptModalOpen, setGptModal] = useState(false);

  // toast alert
  const { setToastAlert } = useToast();
  // store hooks
  const {
    config: { envConfig },
  } = useApplication();
  const {
    currentUser,
    membership: { currentProjectRole },
  } = useUser();
  const {
    archivePage: archivePageAction,
    restorePage: restorePageAction,
    createPage: createPageAction,
    projectPageMap,
    projectArchivedPageMap,
    fetchProjectPages,
    fetchArchivedProjectPages,
    cleanup,
  } = useProjectPages();
  const pageStore = usePage(pageId);
  const {
    lockPage: lockPageAction,
    unlockPage: unlockPageAction,
    updateName: updateNameAction,
    updateDescription: updateDescriptionAction,
    id: pageIdMobx,
    isSubmitting,
    setIsSubmitting,
    owned_by,
    is_locked,
    archived_at,
    created_at,
    created_by,
    updated_at,
    updated_by,
  } = pageStore;
  // hooks
  const { setShowAlert } = useReloadConfirmations(isSubmitting === "submitting");
  // form data
  const { handleSubmit, setValue, watch, getValues, control, reset } = useForm<IPage>({
    defaultValues: { name: "", description_html: "" },
  });
  // derived values
  const pageTitle = pageStore?.name;
  const pageDescription = pageStore?.description_html;
  const isPageReadOnly =
    is_locked ||
    archived_at ||
    (currentProjectRole && [EUserProjectRoles.VIEWER, EUserProjectRoles.GUEST].includes(currentProjectRole));
  const userCanDuplicate =
    currentProjectRole && [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER].includes(currentProjectRole);
  const userCanArchive = isCurrentUserOwner || currentProjectRole === EUserProjectRoles.ADMIN;
  const userCanLock =
    currentProjectRole && [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER].includes(currentProjectRole);
  const isCurrentUserOwner = owned_by === currentUser?.id;

  useEffect(
    () => () => {
      cleanup && cleanup();
    },
    [cleanup]
  );

  const updatePage = async (formData: IPage) => {
    if (!workspaceSlug || !projectId || !pageId) return;
    await updateDescriptionAction(formData.description_html);
  };

  const handleAiAssistance = async (response: string) => {
    if (!workspaceSlug || !projectId || !pageId) return;

    const newDescription = `${watch("description_html")}<p>${response}</p>`;
    setValue("description_html", newDescription);
    editorRef.current?.setEditorValue(newDescription);
    updateDescriptionAction(newDescription);
  };

  const updatePageTitle = (title: string) => {
    if (!workspaceSlug || !projectId || !pageId) return;
    updateNameAction(title);
  };

  const createPage = async (payload: Partial<IPage>) => {
    if (!workspaceSlug || !projectId) return;
    await createPageAction(workspaceSlug as string, projectId as string, payload);
  };

  const duplicate_page = async () => {
    const currentPageValues = getValues();

    if (!currentPageValues?.description_html) {
      // TODO: We need to get latest data the above variable will give us stale data
      currentPageValues.description_html = pageDescription as string;
    }

    const formData: Partial<IPage> = {
      name: "Copy of " + pageTitle,
      description_html: currentPageValues.description_html,
    };

    try {
      await createPage(formData);
    } catch (error) {
      setToastAlert({
        title: `Page could not be duplicated`,
        message: `Sorry, page could not be duplicated, please try again later`,
        type: "error",
      });
    }
  };

  if (!pageId && !workspaceSlug && !projectId) {
    return (
      <div className="grid h-full w-full place-items-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col justify-between">
      <div className="h-full w-full overflow-hidden">
        {isPageReadOnly ? (
          <PageReadOnlyDocument title={pageTitle} description={pageDescription} />
        ) : (
          <PageDocument title={pageTitle} description={pageDescription} />
        )}
        <IssuePeekOverview />
      </div>
    </div>
  );
};
