import React from "react";
// next
import type { NextPage } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
// swr
import useSWR from "swr";
// services
import workspaceService from "lib/services/workspace.service";
// constants
import { WORKSPACE_INVITATION } from "constants/fetch-keys";
// hooks
import useUser from "lib/hooks/useUser";
// layouts
import DefaultLayout from "layouts/DefaultLayout";
// ui
import { Button, Spinner } from "ui";
// icons
import {
  ChartBarIcon,
  CheckIcon,
  ChevronRightIcon,
  CubeIcon,
  ShareIcon,
  StarIcon,
  UserIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { EmptySpace, EmptySpaceItem } from "ui/empty-space";

const WorkspaceInvitation: NextPage = () => {
  const router = useRouter();

  const { invitationId, email } = router.query;

  const { user } = useUser();

  const { data: invitationDetail, error } = useSWR(invitationId && WORKSPACE_INVITATION, () =>
    invitationId ? workspaceService.getWorkspaceInvitation(invitationId as string) : null
  );

  const handleAccept = () => {
    if (!invitationDetail) return;
    workspaceService
      .joinWorkspace(invitationDetail.workspace.slug, invitationDetail.id, {
        accepted: true,
        email: invitationDetail.email,
      })
      .then((res) => {
        router.push("/signin");
      })
      .catch((err) => console.error(err));
  };

  return (
    <DefaultLayout>
      <div className="w-full h-full flex flex-col justify-center items-center px-3">
        {invitationDetail ? (
          <>
            {error ? (
              <div className="bg-gray-50 rounded shadow-2xl border px-4 py-8 w-full md:w-1/3 space-y-4 flex flex-col text-center">
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
                      <EmptySpaceItem
                        Icon={CubeIcon}
                        title="Continue to Dashboard"
                        action={() => router.push("/")}
                      />
                    </EmptySpace>
                  </>
                ) : (
                  <EmptySpace
                    title={`You have been invited to ${invitationDetail.workspace.name}`}
                    description="Your workspace is where you'll create projects, collaborate on your issues, and organize different streams of work in your Plane account."
                  >
                    <EmptySpaceItem Icon={CheckIcon} title="Accept" action={handleAccept} />
                    <EmptySpaceItem
                      Icon={XMarkIcon}
                      title="Ignore"
                      action={() => {
                        router.push("/");
                      }}
                    />
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
            {!user ? (
              <EmptySpaceItem
                Icon={UserIcon}
                title="Sign in to continue"
                action={() => {
                  router.push("/signin");
                }}
              />
            ) : (
              <EmptySpaceItem
                Icon={CubeIcon}
                title="Continue to Dashboard"
                action={() => {
                  router.push("/");
                }}
              />
            )}
            <EmptySpaceItem
              Icon={StarIcon}
              title="Star us on GitHub"
              action={() => {
                router.push("https://github.com/makeplane");
              }}
            />
            <EmptySpaceItem
              Icon={ShareIcon}
              title="Join our community of active creators"
              action={() => {
                router.push("https://discord.com/invite/8SR2N9PAcJ");
              }}
            />
          </EmptySpace>
        ) : (
          <div className="w-full h-full flex justify-center items-center">
            <Spinner />
          </div>
        )}
      </div>
    </DefaultLayout>
  );
};

export default WorkspaceInvitation;
