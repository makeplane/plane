/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { Boxes, Share2, Star, User2 } from "lucide-react";
import { CheckIcon, CloseIcon } from "@plane/propel/icons";
import { useTranslation } from "@plane/i18n";
// components
import { LogoSpinner } from "@/components/common/logo-spinner";
import { EmptySpace, EmptySpaceItem } from "@/components/ui/empty-space";
// constants
import { WORKSPACE_INVITATION } from "@/constants/fetch-keys";
// helpers
import { EPageTypes } from "@/helpers/authentication.helper";
// hooks
import { useUser } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
// wrappers
import { AuthenticationWrapper } from "@/lib/wrappers/authentication-wrapper";
import { WorkspaceService } from "@/services/workspace.service";
// services

// service initialization
const workspaceService = new WorkspaceService();

function WorkspaceInvitationPage() {
  const { t } = useTranslation();
  // router
  const router = useAppRouter();
  // query params
  const searchParams = useSearchParams();
  const invitation_id = searchParams.get("invitation_id");
  const slug = searchParams.get("slug");
  const token = searchParams.get("token");
  // store hooks
  const { data: currentUser } = useUser();

  const { data: invitationDetail, error } = useSWR(
    invitation_id && slug && WORKSPACE_INVITATION(invitation_id.toString()),
    invitation_id && slug
      ? () => workspaceService.getWorkspaceInvitation(slug.toString(), invitation_id.toString())
      : null
  );

  const handleAccept = () => {
    if (!invitationDetail) return;
    workspaceService
      .joinWorkspace(invitationDetail.workspace.slug, invitationDetail.id, {
        accepted: true,
        token: token,
      })
      .then(() => {
        if (invitationDetail.email === currentUser?.email) {
          return router.push(`/${invitationDetail.workspace.slug}`);
        }
        return router.push("/");
      })
      .catch((err: unknown) => console.error(err));
  };

  const handleReject = () => {
    if (!invitationDetail || !token) return;
    void workspaceService
      .joinWorkspace(invitationDetail.workspace.slug, invitationDetail.id, {
        accepted: false,
        token: token,
      })
      .then(() => {
        return router.push("/");
      })
      .catch((err: unknown) => console.error(err));
  };

  return (
    <AuthenticationWrapper pageType={EPageTypes.PUBLIC}>
      <div className="flex h-full w-full flex-col items-center justify-center px-3">
        {invitationDetail && !invitationDetail.responded_at ? (
          error ? (
            <div className="shadow-2xl flex w-full flex-col space-y-4 rounded-sm border border-subtle bg-surface-1 px-4 py-8 text-center md:w-1/3">
              <h2 className="text-18 uppercase">{t("localized_ui.workspace_invitation.invitation_not_found")}</h2>
            </div>
          ) : (
            <EmptySpace
              title={t("localized_ui.workspace_invitation.invited_to_workspace", {
                workspaceName: invitationDetail.workspace.name,
              })}
              description={t("localized_ui.workspace_invitation.description")}
            >
              <EmptySpaceItem
                Icon={CheckIcon}
                title={t("localized_ui.workspace_invitation.accept")}
                action={handleAccept}
              />
              <EmptySpaceItem
                Icon={CloseIcon}
                title={t("localized_ui.workspace_invitation.ignore")}
                action={handleReject}
              />
            </EmptySpace>
          )
        ) : error || invitationDetail?.responded_at ? (
          invitationDetail?.accepted ? (
            <EmptySpace
              title={t("localized_ui.workspace_invitation.already_member", {
                workspaceName: invitationDetail.workspace.name,
              })}
              description={t("localized_ui.workspace_invitation.description")}
            >
              <EmptySpaceItem Icon={Boxes} title={t("localized_ui.workspace_invitation.continue_to_home")} href="/" />
            </EmptySpace>
          ) : (
            <EmptySpace
              title={t("localized_ui.workspace_invitation.inactive_title")}
              description={t("localized_ui.workspace_invitation.description")}
              link={{ text: t("localized_ui.workspace_invitation.empty_project_link"), href: "/" }}
            >
              {!currentUser ? (
                <EmptySpaceItem
                  Icon={User2}
                  title={t("localized_ui.workspace_invitation.sign_in_to_continue")}
                  href="/"
                />
              ) : (
                <EmptySpaceItem Icon={Boxes} title={t("localized_ui.workspace_invitation.continue_to_home")} href="/" />
              )}
              <EmptySpaceItem
                Icon={Star}
                title={t("localized_ui.workspace_invitation.star_on_github")}
                href="https://github.com/makeplane"
              />
              <EmptySpaceItem
                Icon={Share2}
                title={t("localized_ui.workspace_invitation.join_community")}
                href="https://forum.plane.so"
              />
            </EmptySpace>
          )
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <LogoSpinner />
          </div>
        )}
      </div>
    </AuthenticationWrapper>
  );
}

export default observer(WorkspaceInvitationPage);
