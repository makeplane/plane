import { useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button, getButtonStyling } from "@plane/propel/button";
import { PlaneLogo } from "@plane/propel/icons";
import type { IWorkspace } from "@plane/types";
// assets
import WorkspaceCreationDisabled from "@/app/assets/workspace/workspace-creation-disabled.png?url";
// components
import { CreateWorkspaceForm } from "@/components/workspace/create-workspace-form";
// hooks
import { useUser, useUserProfile } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
// wrappers
import { AuthenticationWrapper } from "@/lib/wrappers/authentication-wrapper";
// plane web helpers
import { getIsWorkspaceCreationDisabled } from "@/plane-web/helpers/instance.helper";

const CreateWorkspacePage = observer(function CreateWorkspacePage() {
  const { t } = useTranslation();
  // router
  const router = useAppRouter();
  // store hooks
  const { data: currentUser } = useUser();
  const { updateUserProfile } = useUserProfile();
  // states
  const [defaultValues, setDefaultValues] = useState<Pick<IWorkspace, "name" | "slug" | "organization_size">>({
    name: "",
    slug: "",
    organization_size: "",
  });
  // derived values
  const isWorkspaceCreationDisabled = getIsWorkspaceCreationDisabled();

  // methods
  const getMailtoHref = () => {
    const subject = t("workspace_creation.request_email.subject");
    const body = t("workspace_creation.request_email.body", {
      firstName: currentUser?.first_name || "",
      lastName: currentUser?.last_name || "",
      email: currentUser?.email || "",
    });

    return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const onSubmit = async (workspace: IWorkspace) => {
    await updateUserProfile({ last_workspace_id: workspace.id }).then(() => router.push(`/${workspace.slug}`));
  };

  return (
    <AuthenticationWrapper>
      <div className="flex h-full flex-col gap-y-2 overflow-hidden sm:flex-row sm:gap-y-0 bg-surface-1">
        <div className="relative h-1/6 flex-shrink-0 sm:w-2/12 md:w-3/12 lg:w-1/5">
          <div className="absolute left-0 top-1/2 h-[0.5px] w-full -translate-y-1/2 border-b-[0.5px] border-subtle sm:left-1/2 sm:top-0 sm:h-screen sm:w-[0.5px] sm:-translate-x-1/2 sm:translate-y-0 sm:border-r-[0.5px] md:left-1/3" />
          <Link
            className="absolute left-5 top-1/2 grid -translate-y-1/2 place-items-center px-3 sm:left-1/2 sm:top-12 sm:-translate-x-[15px] sm:translate-y-0 sm:px-0 sm:py-5 md:left-1/3"
            href="/"
          >
            <PlaneLogo className="h-9 w-auto text-primary" />
          </Link>
          <div className="absolute right-4 top-1/4 -translate-y-1/2 text-13 text-primary sm:fixed sm:right-16 sm:top-12 sm:translate-y-0 sm:py-5">
            {currentUser?.email}
          </div>
        </div>
        <div className="relative flex h-full justify-center px-8 pb-8 sm:w-10/12 sm:items-center sm:justify-start sm:p-0 sm:pr-[8.33%] md:w-9/12 lg:w-4/5">
          {isWorkspaceCreationDisabled ? (
            <div className="w-4/5 h-full flex flex-col items-center justify-center text-16 font-medium gap-1">
              <img
                src={WorkspaceCreationDisabled}
                className="w-full h-full object-contain mb-4"
                alt="Workspace creation disabled"
              />
              <div className="text-16 font-medium text-center">
                {t("workspace_creation.errors.creation_disabled.title")}
              </div>
              <p className="text-13 text-tertiary break-words text-center">
                {t("workspace_creation.errors.creation_disabled.description")}
              </p>
              <div className="flex gap-4 mt-6">
                <Button variant="primary" onClick={() => router.back()}>
                  {t("common.go_back")}
                </Button>
                <a href={getMailtoHref()} className={getButtonStyling("secondary", "base")}>
                  {t("workspace_creation.errors.creation_disabled.request_button")}
                </a>
              </div>
            </div>
          ) : (
            <div className="w-full space-y-7 sm:space-y-10">
              <h4 className="text-20 font-semibold">{t("workspace_creation.heading")}</h4>
              <div className="sm:w-3/4 md:w-2/5">
                <CreateWorkspaceForm
                  onSubmit={onSubmit}
                  defaultValues={defaultValues}
                  setDefaultValues={setDefaultValues}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthenticationWrapper>
  );
});

export default CreateWorkspacePage;
