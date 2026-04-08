/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { LogOut } from "lucide-react";
import Link from "next/link";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button, getButtonStyling } from "@plane/propel/button";
import { PlaneLockup } from "@plane/propel/icons";
import type { IWorkspace } from "@plane/types";
// assets
import WorkspaceCreationDisabled from "@/app/assets/workspace/workspace-creation-disabled.png?url";
// components
import { CreateWorkspaceForm } from "@/components/workspace/create-workspace-form";
// hooks
import { useUser, useUserProfile } from "@/hooks/store/user";
import { useInstance } from "@/hooks/store/use-instance";
import { useAppRouter } from "@/hooks/use-app-router";
// wrappers
import { AuthenticationWrapper } from "@/lib/wrappers/authentication-wrapper";

const CreateWorkspacePage = observer(function CreateWorkspacePage() {
  const { t } = useTranslation();
  // router
  const router = useAppRouter();
  // store hooks
  const { config } = useInstance();
  const { data: currentUser, signOut } = useUser();
  const { updateUserProfile } = useUserProfile();
  // states
  const [defaultValues, setDefaultValues] = useState<Pick<IWorkspace, "name" | "slug" | "organization_size">>({
    name: "",
    slug: "",
    organization_size: "",
  });
  // derived values
  const isWorkspaceCreationDisabled = config?.is_workspace_creation_disabled ?? false;

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

  const handleSignOut = async () => {
    await signOut().catch(() => {});
    router.push("/");
  };

  const onSubmit = async (workspace: IWorkspace) => {
    await updateUserProfile({ last_workspace_id: workspace.id }).then(() => router.push(`/${workspace.slug}`));
  };

  return (
    <AuthenticationWrapper>
      <div className="flex relative size-full overflow-hidden bg-canvas rounded-lg transition-all ease-in-out duration-300">
        <div className="size-full p-2 flex-grow transition-all ease-in-out duration-300 overflow-hidden">
          <div className="relative flex flex-col h-full w-full overflow-hidden rounded-lg bg-surface-1 shadow-md border border-subtle">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 flex-shrink-0 border-b border-subtle">
              <Link href="/">
                <PlaneLockup height={20} width={95} className="text-primary" />
              </Link>
              <div className="flex items-center gap-3">
                <span className="text-13 text-tertiary">{currentUser?.email}</span>
                <Button
                  variant="link"
                  size="sm"
                  onClick={handleSignOut}
                  className="!text-danger-primary hover:!text-danger-primary-hover no-underline"
                >
                  <LogOut className="shrink-0 size-3.5 mr-1" />
                  {t("sign_out")}
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-grow overflow-y-auto flex items-center justify-center p-6 sm:p-10">
              {isWorkspaceCreationDisabled ? (
                <div className="w-full max-w-sm flex flex-col items-center text-center gap-4">
                  <img
                    src={WorkspaceCreationDisabled}
                    className="w-64 h-auto object-contain"
                    alt="Workspace creation disabled"
                  />
                  <div className="text-16 font-medium">{t("workspace_creation.errors.creation_disabled.title")}</div>
                  <p className="text-13 text-tertiary">
                    {t("workspace_creation.errors.creation_disabled.description")}
                  </p>
                  <div className="flex gap-4 mt-2">
                    <Button variant="primary" onClick={() => router.back()}>
                      {t("common.go_back")}
                    </Button>
                    <a href={getMailtoHref()} className={getButtonStyling("secondary", "base")}>
                      {t("workspace_creation.errors.creation_disabled.request_button")}
                    </a>
                  </div>
                </div>
              ) : (
                <div className="w-full max-w-md space-y-7 sm:space-y-10">
                  <h4 className="text-20 font-semibold">{t("workspace_creation.heading")}</h4>
                  <CreateWorkspaceForm
                    onSubmit={onSubmit}
                    defaultValues={defaultValues}
                    setDefaultValues={setDefaultValues}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthenticationWrapper>
  );
});

export default CreateWorkspacePage;
