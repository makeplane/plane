import React, { ReactElement } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import useSWR from "swr";
import { Boxes, Check, Share2, Star, User2, X } from "lucide-react";
// components
import { LogoSpinner } from "@/components/common";
import { EmptySpace, EmptySpaceItem } from "@/components/ui/empty-space";
// constants
import { WORKSPACE_INVITATION } from "@/constants/fetch-keys";
// helpers
import { EPageTypes } from "@/helpers/authentication.helper";
// hooks
import { useUser } from "@/hooks/store";
// layouts
import DefaultLayout from "@/layouts/default-layout";
// types
import { NextPageWithLayout } from "@/lib/types";
// wrappers
import { AuthenticationWrapper } from "@/lib/wrappers";
// services
import { WorkspaceService } from "@/services/workspace.service";

// service initialization
const workspaceService = new WorkspaceService();

const WorkspaceInvitationPage: NextPageWithLayout = observer(() => {
  // router
  const router = useRouter();
  const { invitation_id, email, slug } = router.query;
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
        email: invitationDetail.email,
      })
      .then(() => {
        if (email === currentUser?.email) {
          router.push("/invitations");
        } else {
          router.push({ pathname: "/", query: router.query });
        }
      })
      .catch((err) => console.error(err));
  };

  const handleReject = () => {
    if (!invitationDetail) return;
    workspaceService
      .joinWorkspace(invitationDetail.workspace.slug, invitationDetail.id, {
        accepted: false,
        email: invitationDetail.email,
      })
      .then(() => {
        router.push("/");
      })
      .catch((err) => console.error(err));
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-3">
      {invitationDetail && !invitationDetail.responded_at ? (
        error ? (
          <div className="flex w-full flex-col space-y-4 rounded border border-custom-border-200 bg-custom-background-100 px-4 py-8 text-center shadow-2xl md:w-1/3">
            <h2 className="text-xl uppercase">INVITATION NOT FOUND</h2>
          </div>
        ) : (
          <EmptySpace
            title={`You have been invited to ${invitationDetail.workspace.name}`}
            description="Your workspace is where you'll create projects, collaborate on your issues, and organize different streams of work in your Plane account."
          >
            <EmptySpaceItem Icon={Check} title="Accept" action={handleAccept} />
            <EmptySpaceItem Icon={X} title="Ignore" action={handleReject} />
          </EmptySpace>
        )
      ) : error || invitationDetail?.responded_at ? (
        invitationDetail?.accepted ? (
          <EmptySpace
            title={`You are already a member of ${invitationDetail.workspace.name}`}
            description="Your workspace is where you'll create projects, collaborate on your issues, and organize different streams of work in your Plane account."
          >
            <EmptySpaceItem Icon={Boxes} title="Continue to home" href="/" />
          </EmptySpace>
        ) : (
          <EmptySpace
            title="This invitation link is not active anymore."
            description="Your workspace is where you'll create projects, collaborate on your issues, and organize different streams of work in your Plane account."
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
              href="https://discord.com/invite/A92xrEGCge"
            />
          </EmptySpace>
        )
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <LogoSpinner />
        </div>
      )}
    </div>
  );
});

WorkspaceInvitationPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <DefaultLayout>
      <AuthenticationWrapper pageType={EPageTypes.PUBLIC}>{page}</AuthenticationWrapper>
    </DefaultLayout>
  );
};

export default WorkspaceInvitationPage;
