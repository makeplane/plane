/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { Boxes, LogOut, Share2, Star, User2 } from "lucide-react";
import { CheckIcon, CloseIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
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

const getJoinErrorMessage = (err: unknown) => {
  if (err && typeof err === "object" && "error" in err && typeof (err as { error?: unknown }).error === "string") {
    return (err as { error: string }).error;
  }
  return "Something went wrong. Please try again.";
};

function WorkspaceInvitationPage() {
  // states
  const [isSubmitting, setIsSubmitting] = useState(false);
  // router
  const router = useAppRouter();
  // query params
  const searchParams = useSearchParams();
  const invitation_id = searchParams.get("invitation_id");
  const slug = searchParams.get("slug");
  const token = searchParams.get("token");
  // store hooks
  const { data: currentUser, signOut } = useUser();

  const { data: invitationDetail, error } = useSWR(
    invitation_id && slug && WORKSPACE_INVITATION(invitation_id.toString()),
    invitation_id && slug
      ? () => workspaceService.getWorkspaceInvitation(slug.toString(), invitation_id.toString())
      : null
  );

  const invitationEmail = invitationDetail?.email?.toLowerCase();
  const currentEmail = currentUser?.email?.toLowerCase();
  const isEmailMismatch = Boolean(invitationEmail && currentEmail && invitationEmail !== currentEmail);

  const handleAccept = async () => {
    if (!invitationDetail || isSubmitting) return;
    if (isEmailMismatch) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Wrong account",
        message: `This invitation was sent to ${invitationDetail.email}. Sign in with that email to accept.`,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await workspaceService.joinWorkspace(invitationDetail.workspace.slug, invitationDetail.id, {
        accepted: true,
        token: token,
      });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Invitation accepted",
        message: `You joined ${invitationDetail.workspace.name}.`,
      });
      router.push(`/${invitationDetail.workspace.slug}`);
    } catch (err: unknown) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Could not accept invitation",
        message: getJoinErrorMessage(err),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!invitationDetail || !token || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await workspaceService.joinWorkspace(invitationDetail.workspace.slug, invitationDetail.id, {
        accepted: false,
        token: token,
      });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Invitation declined",
        message: "You declined this workspace invitation.",
      });
      router.push("/");
    } catch (err: unknown) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Could not decline invitation",
        message: getJoinErrorMessage(err),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSwitchAccount = async () => {
    try {
      await signOut();
      router.push(`/?next_path=${encodeURIComponent(window.location.pathname + window.location.search)}`);
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error",
        message: "Could not sign out. Please try again.",
      });
    }
  };

  return (
    <AuthenticationWrapper pageType={EPageTypes.PUBLIC}>
      <div className="flex h-full w-full flex-col items-center justify-center px-3">
        {invitationDetail && !invitationDetail.responded_at ? (
          error ? (
            <div className="shadow-2xl flex w-full flex-col space-y-4 rounded-sm border border-subtle bg-surface-1 px-4 py-8 text-center md:w-1/3">
              <h2 className="text-18 uppercase">INVITATION NOT FOUND</h2>
            </div>
          ) : isEmailMismatch ? (
            <EmptySpace
              title="Signed in with a different email"
              description={`This invitation was sent to ${invitationDetail.email}, but you are signed in as ${currentUser?.email}. Switch accounts to accept it.`}
            >
              <EmptySpaceItem Icon={LogOut} title="Sign out and switch account" action={handleSwitchAccount} />
              <EmptySpaceItem Icon={Boxes} title="Continue to home" href="/" />
            </EmptySpace>
          ) : (
            <EmptySpace
              title={`You have been invited to ${invitationDetail.workspace.name}`}
              description="Your workspace is where you'll create projects, collaborate on your work items, and organize different streams of work in your Plane account."
            >
              <EmptySpaceItem Icon={CheckIcon} title={isSubmitting ? "Accepting..." : "Accept"} action={handleAccept} />
              <EmptySpaceItem
                Icon={CloseIcon}
                title={isSubmitting ? "Please wait..." : "Ignore"}
                action={handleReject}
              />
            </EmptySpace>
          )
        ) : error || invitationDetail?.responded_at ? (
          invitationDetail?.accepted ? (
            <EmptySpace
              title={`You are already a member of ${invitationDetail.workspace.name}`}
              description="Your workspace is where you'll create projects, collaborate on your work items, and organize different streams of work in your Plane account."
            >
              <EmptySpaceItem Icon={Boxes} title="Continue to home" href="/" />
            </EmptySpace>
          ) : (
            <EmptySpace
              title="This invitation link is not active anymore."
              description="Your workspace is where you'll create projects, collaborate on your work items, and organize different streams of work in your Plane account."
              link={{ text: "Or start from an empty project", href: "/" }}
            >
              {!currentUser ? (
                <EmptySpaceItem Icon={User2} title="Sign in to continue" href="/" />
              ) : (
                <EmptySpaceItem Icon={Boxes} title="Continue to home" href="/" />
              )}
              <EmptySpaceItem Icon={Star} title="Star us on GitHub" href="https://github.com/makeplane" />
              <EmptySpaceItem
                Icon={Share2}
                title="Join our community of active creators"
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
