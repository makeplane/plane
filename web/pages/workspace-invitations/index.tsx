import React, { ReactElement } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import { Boxes, Check, Share2, Star, User2, X } from "lucide-react";
import { observer } from "mobx-react-lite";
// hooks
import { useUser } from "hooks/store";
// services
import { WorkspaceService } from "services/workspace.service";
// layouts
import DefaultLayout from "layouts/default-layout";
// ui
import { Spinner } from "@plane/ui";
// icons
import { EmptySpace, EmptySpaceItem } from "components/ui/empty-space";
// types
import { NextPageWithLayout } from "lib/types";
// constants
import { WORKSPACE_INVITATION } from "constants/fetch-keys";

// services
const workspaceService = new WorkspaceService();

const WorkspaceInvitationPage: NextPageWithLayout = observer(() => {
  // router
  const router = useRouter();
  const { invitation_id, email, slug } = router.query;
  // store hooks
  const { currentUser } = useUser();

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
          router.push("/");
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
      {invitationDetail ? (
        <>
          {error ? (
            <div className="flex w-full flex-col space-y-4 rounded border border-custom-border-200 bg-custom-background-100 px-4 py-8 text-center shadow-2xl md:w-1/3">
              <h2 className="text-xl uppercase">INVITATION NOT FOUND</h2>
            </div>
          ) : (
            <>
              {invitationDetail.accepted ? (
                <>
                  <EmptySpace
                    title={`You are already a member of ${invitationDetail.workspace.name}`}
                    description="Your workspace is where you'll create projects, collaborate on your issues, and organize different streams of work in your Plane account."
                  >
                    <EmptySpaceItem Icon={Boxes} title="Continue to Dashboard" href="/" />
                  </EmptySpace>
                </>
              ) : (
                <EmptySpace
                  title={`You have been invited to ${invitationDetail.workspace.name}`}
                  description="Your workspace is where you'll create projects, collaborate on your issues, and organize different streams of work in your Plane account."
                >
                  <EmptySpaceItem Icon={Check} title="Accept" action={handleAccept} />
                  <EmptySpaceItem Icon={X} title="Ignore" action={handleReject} />
                </EmptySpace>
              )}
            </>
          )}
        </>
      ) : error ? (
        <EmptySpace
          title="This invitation link is not active anymore."
          description="Your workspace is where you'll create projects, collaborate on your issues, and organize different streams of work in your Plane account."
          link={{ text: "Or start from an empty project", href: "/" }}
        >
          {!currentUser ? (
            <EmptySpaceItem Icon={User2} title="Sign in to continue" href="/" />
          ) : (
            <EmptySpaceItem Icon={Boxes} title="Continue to Dashboard" href="/" />
          )}
          <EmptySpaceItem Icon={Star} title="Star us on GitHub" href="https://github.com/makeplane" />
          <EmptySpaceItem
            Icon={Share2}
            title="Join our community of active creators"
            href="https://discord.com/invite/8SR2N9PAcJ"
          />
        </EmptySpace>
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Spinner />
        </div>
      )}
    </div>
  );
});

WorkspaceInvitationPage.getLayout = function getLayout(page: ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>;
};

export default WorkspaceInvitationPage;
