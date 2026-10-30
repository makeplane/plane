/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { observer } from "mobx-react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import {
  BoxesOutline,
  CloseOutline,
  ShareAltOutline,
  StarOutline,
  TickOutline,
  UserOutline,
} from "@makeplane/propel/icons";
// components
import { LogoSpinner } from "@/components/common/logo-spinner";
import { EmptySpace, EmptySpaceItem } from "@/components/ui/empty-space";
// constants
import { WORKSPACE_INVITATION } from "@plane/constants";
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
          router.push(`/${invitationDetail.workspace.slug}`);
        } else {
          router.push("/");
        }

        return undefined;
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
        router.push("/");

        return undefined;
      })
      .catch((err: unknown) => console.error(err));
  };

  return (
    <AuthenticationWrapper pageType={EPageTypes.PUBLIC}>
      <div className="flex h-full w-full flex-col items-center justify-center px-3">
        {invitationDetail && !invitationDetail.responded_at ? (
          error ? (
            <div className="shadow-2xl flex w-full flex-col space-y-4 rounded-sm border border-subtle bg-surface-1 px-4 py-8 text-center md:w-1/3">
              <h2 className="text-18 uppercase">{t("web_ui.invitation_not_found")}</h2>
            </div>
          ) : (
            <EmptySpace
              title={t("web_ui.dynamic_you_have_been_invited_to_value0", { value0: invitationDetail.workspace.name })}
              description={t(
                "web_ui.your_workspace_is_where_you_ll_create_projects_collaborate_on_your_work_items_and_organize"
              )}
            >
              <EmptySpaceItem Icon={TickOutline} title={t("inbox_issue.actions.accept")} action={handleAccept} />
              <EmptySpaceItem Icon={CloseOutline} title={t("web_ui.ignore")} action={handleReject} />
            </EmptySpace>
          )
        ) : error || invitationDetail?.responded_at ? (
          invitationDetail?.accepted ? (
            <EmptySpace
              title={t("web_ui.dynamic_you_are_already_a_member_of_value0", {
                value0: invitationDetail.workspace.name,
              })}
              description={t(
                "web_ui.your_workspace_is_where_you_ll_create_projects_collaborate_on_your_work_items_and_organize"
              )}
            >
              <EmptySpaceItem Icon={BoxesOutline} title={t("web_ui.continue_to_home")} href="/" />
            </EmptySpace>
          ) : (
            <EmptySpace
              title={t("web_ui.this_invitation_link_is_not_active_anymore")}
              description={t(
                "web_ui.your_workspace_is_where_you_ll_create_projects_collaborate_on_your_work_items_and_organize"
              )}
              link={{ text: "Or start from an empty project", href: "/" }}
            >
              {!currentUser ? (
                <EmptySpaceItem Icon={UserOutline} title={t("web_ui.sign_in_to_continue")} href="/" />
              ) : (
                <EmptySpaceItem Icon={BoxesOutline} title={t("web_ui.continue_to_home")} href="/" />
              )}
              <EmptySpaceItem
                Icon={StarOutline}
                title={t("home.star_us_on_github")}
                href="https://github.com/makeplane"
              />
              <EmptySpaceItem
                Icon={ShareAltOutline}
                title={t("web_ui.join_our_community_of_active_creators")}
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
