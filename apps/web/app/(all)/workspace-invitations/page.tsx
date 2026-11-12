/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { AnchorButton } from "@makeplane/propel/components/anchor-button";
import { Button } from "@makeplane/propel/components/button";
import { EmptyStateDetailed } from "@plane/blocks/empty-state";
// components
import { LogoSpinner } from "@/components/common/logo-spinner";
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
      })
      .catch((err: unknown) => console.error(err));
  };

  return (
    <AuthenticationWrapper pageType={EPageTypes.PUBLIC}>
      <div className="flex h-full w-full flex-col items-center justify-center px-3">
        {invitationDetail && !invitationDetail.responded_at ? (
          error ? (
            <EmptyStateDetailed
              align="center"
              assetKey="invalid-link"
              assetClassName="size-40"
              title="INVITATION NOT FOUND"
            />
          ) : (
            <EmptyStateDetailed
              align="center"
              assetKey="inbox"
              title={`You have been invited to ${invitationDetail.workspace.name}`}
              description="Your workspace is where you'll create projects, collaborate on your work items, and organize different streams of work in your Plane account."
              actions={[
                { label: "Accept", variant: "primary", onClick: handleAccept },
                { label: "Ignore", variant: "secondary", onClick: handleReject },
              ]}
            />
          )
        ) : error || invitationDetail?.responded_at ? (
          invitationDetail?.accepted ? (
            <EmptyStateDetailed
              align="center"
              assetKey="project"
              title={`You are already a member of ${invitationDetail.workspace.name}`}
              description="Your workspace is where you'll create projects, collaborate on your work items, and organize different streams of work in your Plane account."
              customButton={
                <Button
                  variant="primary"
                  size="lg"
                  stretch="auto"
                  label="Continue to home"
                  nativeButton={false}
                  render={<Link href="/" />}
                />
              }
            />
          ) : (
            <EmptyStateDetailed
              align="center"
              assetKey="invalid-link"
              title="This invitation link is not active anymore."
              description="Your workspace is where you'll create projects, collaborate on your work items, and organize different streams of work in your Plane account."
              customButton={
                <div className="flex flex-col items-center gap-4">
                  <Button
                    variant="primary"
                    size="lg"
                    stretch="auto"
                    label={!currentUser ? "Sign in to continue" : "Continue to home"}
                    nativeButton={false}
                    render={<Link href="/" />}
                  />
                  <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                    <AnchorButton
                      variant="secondary"
                      size="md"
                      href="https://github.com/makeplane"
                      external
                      label="Star us on GitHub"
                    />
                    <AnchorButton
                      variant="secondary"
                      size="md"
                      href="https://forum.plane.so"
                      external
                      label="Join our community of active creators"
                    />
                    <AnchorButton
                      variant="secondary"
                      size="md"
                      render={<Link href="/" />}
                      label="Or start from an empty project"
                    />
                  </div>
                </div>
              }
            />
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
