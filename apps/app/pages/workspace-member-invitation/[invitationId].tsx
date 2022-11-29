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
import { Button } from "ui";
// icons
import {
  ChartBarIcon,
  ChevronRightIcon,
  CubeIcon,
  ShareIcon,
  StarIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { EmptySpace, EmptySpaceItem } from "ui/EmptySpace";

const WorkspaceInvitation: NextPage = () => {
  const router = useRouter();

  const { invitationId, email } = router.query;

  const { user } = useUser();

  const { data: invitationDetail, error } = useSWR(WORKSPACE_INVITATION, () =>
    workspaceService.getWorkspaceInvitation(invitationId as string)
  );

  const handleAccept = () => {
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
                <div className="bg-gray-50 rounded shadow-2xl border px-4 py-8 w-full md:w-1/3 space-y-4 flex flex-col justify-between">
                  {invitationDetail.accepted ? (
                    <>
                      <h2 className="text-2xl">
                        You are already a member of {invitationDetail.workspace.name}
                      </h2>
                      <div className="w-full flex gap-x-4">
                        <Link href="/signin">
                          <a className="w-full">
                            <Button className="w-full">Go To Login Page</Button>
                          </a>
                        </Link>
                      </div>
                    </>
                  ) : (
                    <>
                      <h2 className="text-2xl">
                        You have been invited to{" "}
                        <span className="font-semibold italic">
                          {invitationDetail.workspace.name}
                        </span>
                      </h2>
                      <div className="w-full flex gap-x-4">
                        <Link href="/">
                          <a className="w-full">
                            <Button theme="secondary" className="w-full">
                              Ignore
                            </Button>
                          </a>
                        </Link>

                        <Button className="w-full" onClick={handleAccept}>
                          Accept
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </>
        ) : (
          <>
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
          </>
        )}
      </div>
    </DefaultLayout>
  );
};

export default WorkspaceInvitation;
