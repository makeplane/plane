import { useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";

import useSWR, { mutate } from "swr";
import { CheckCircle2 } from "lucide-react";
// plane imports
import { ROLE } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// types
import { Button } from "@plane/propel/button";
import { PlaneLogo } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IWorkspaceMemberInvitation } from "@plane/types";
import { truncateText } from "@plane/utils";
// assets
import emptyInvitation from "@/app/assets/empty-state/invitation.svg?url";
// components
import { EmptyState } from "@/components/common/empty-state";
import { WorkspaceLogo } from "@/components/workspace/logo";
import { USER_WORKSPACES_LIST } from "@/constants/fetch-keys";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUser, useUserProfile } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
// services
import { AuthenticationWrapper } from "@/lib/wrappers/authentication-wrapper";
// plane web services
import { WorkspaceService } from "@/plane-web/services";

const workspaceService = new WorkspaceService();

function UserInvitationsPage() {
  // states
  const [invitationsRespond, setInvitationsRespond] = useState<string[]>([]);
  const [isJoiningWorkspaces, setIsJoiningWorkspaces] = useState(false);
  // router
  const router = useAppRouter();
  // store hooks
  const { t } = useTranslation();
  const { data: currentUser } = useUser();
  const { updateUserProfile } = useUserProfile();

  const { fetchWorkspaces } = useWorkspace();

  const { data: invitations } = useSWR("USER_WORKSPACE_INVITATIONS", () => workspaceService.userWorkspaceInvitations());

  const redirectWorkspaceSlug =
    // currentUserSettings?.workspace?.last_workspace_slug ||
    // currentUserSettings?.workspace?.fallback_workspace_slug ||
    "";

  const handleInvitation = (workspace_invitation: IWorkspaceMemberInvitation, action: "accepted" | "withdraw") => {
    if (action === "accepted") {
      setInvitationsRespond((prevData) => [...prevData, workspace_invitation.id]);
    } else if (action === "withdraw") {
      setInvitationsRespond((prevData) => prevData.filter((item: string) => item !== workspace_invitation.id));
    }
  };

  const submitInvitations = () => {
    if (invitationsRespond.length === 0) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: t("please_select_at_least_one_invitation"),
      });
      return;
    }

    setIsJoiningWorkspaces(true);

    workspaceService
      .joinWorkspaces({ invitations: invitationsRespond })
      .then(() => {
        mutate(USER_WORKSPACES_LIST);
        const firstInviteId = invitationsRespond[0];
        const invitation = invitations?.find((i) => i.id === firstInviteId);
        const redirectWorkspace = invitations?.find((i) => i.id === firstInviteId)?.workspace;
        updateUserProfile({ last_workspace_id: redirectWorkspace?.id })
          .then(() => {
            setIsJoiningWorkspaces(false);
            fetchWorkspaces().then(() => {
              router.push(`/${redirectWorkspace?.slug}`);
            });
          })
          .catch(() => {
            setToast({
              type: TOAST_TYPE.ERROR,
              title: t("error"),
              message: t("something_went_wrong_please_try_again"),
            });
            setIsJoiningWorkspaces(false);
          });
      })
      .catch((_err) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("error"),
          message: t("something_went_wrong_please_try_again"),
        });
        setIsJoiningWorkspaces(false);
      });
  };

  return (
    <AuthenticationWrapper>
      <div className="flex h-full flex-col gap-y-2 overflow-hidden sm:flex-row sm:gap-y-0">
        <div className="relative h-1/6 flex-shrink-0 sm:w-2/12 md:w-3/12 lg:w-1/5">
          <div className="absolute left-0 top-1/2 h-[0.5px] w-full -translate-y-1/2 border-b-[0.5px] border-subtle sm:left-1/2 sm:top-0 sm:h-screen sm:w-[0.5px] sm:-translate-x-1/2 sm:translate-y-0 sm:border-r-[0.5px] md:left-1/3" />
          <Link
            href="/"
            className="absolute left-5 top-1/2 grid -translate-y-1/2 place-items-center px-3 sm:left-1/2 sm:top-12 sm:-translate-x-[15px] sm:translate-y-0 sm:px-0 sm:py-5 md:left-1/3 z-10"
          >
            <PlaneLogo className="h-9 w-auto text-primary" />
          </Link>
          <div className="absolute right-4 top-1/4 -translate-y-1/2 text-13 text-primary sm:fixed sm:right-16 sm:top-12 sm:translate-y-0 sm:py-5">
            {currentUser?.email}
          </div>
        </div>
        {invitations ? (
          invitations.length > 0 ? (
            <div className="relative flex h-full justify-center px-8 pb-8 sm:w-10/12 sm:items-center sm:justify-start sm:p-0 sm:pr-[8.33%] md:w-9/12 lg:w-4/5">
              <div className="w-full space-y-10">
                <h5 className="text-16">{t("we_see_that_someone_has_invited_you_to_join_a_workspace")}</h5>
                <h4 className="text-20 font-semibold">{t("join_a_workspace")}</h4>
                <div className="max-h-[37vh] space-y-4 overflow-y-auto md:w-3/5">
                  {invitations.map((invitation) => {
                    const isSelected = invitationsRespond.includes(invitation.id);

                    return (
                      <div
                        key={invitation.id}
                        className={`flex cursor-pointer items-center gap-2 rounded-sm border px-3.5 py-5 ${
                          isSelected ? "border-accent-strong" : "border-subtle hover:bg-layer-1"
                        }`}
                        onClick={() => handleInvitation(invitation, isSelected ? "withdraw" : "accepted")}
                      >
                        <div className="flex-shrink-0">
                          <WorkspaceLogo
                            logo={invitation.workspace.logo_url}
                            name={invitation.workspace.name}
                            classNames="size-9 flex-shrink-0"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-13 font-medium">{truncateText(invitation.workspace.name, 30)}</div>
                          <p className="text-11 text-secondary">{ROLE[invitation.role]}</p>
                        </div>
                        <span className={`flex-shrink-0 ${isSelected ? "text-accent-primary" : "text-secondary"}`}>
                          <CheckCircle2 className="h-5 w-5" />
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="primary"
                    type="submit"
                    size="lg"
                    onClick={submitInvitations}
                    disabled={isJoiningWorkspaces || invitationsRespond.length === 0}
                    loading={isJoiningWorkspaces}
                  >
                    {t("accept_and_join")}
                  </Button>
                  <Link href={`/${redirectWorkspaceSlug}`}>
                    <span>
                      <Button variant="secondary" size="lg">
                        {t("go_home")}
                      </Button>
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="fixed left-0 top-0 grid h-full w-full place-items-center">
              <EmptyState
                title={t("no_pending_invites")}
                description={t("you_can_see_here_if_someone_invites_you_to_a_workspace")}
                image={emptyInvitation}
                primaryButton={{
                  text: t("back_to_home"),
                  onClick: () => router.push("/"),
                }}
              />
            </div>
          )
        ) : null}
      </div>
    </AuthenticationWrapper>
  );
}

export default observer(UserInvitationsPage);
