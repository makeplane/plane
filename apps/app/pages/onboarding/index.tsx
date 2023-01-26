import { useState } from "react";

import Image from "next/image";
import { useRouter } from "next/router";
// hooks
import type { NextPage, NextPageContext } from "next";
import useUser from "hooks/use-user";
// lib
import { requiredAuth } from "lib/auth";
// layouts
import DefaultLayout from "layouts/default-layout";
// components
import Welcome from "components/onboarding/welcome";
import PlanWithIssues from "components/onboarding/plan-with-issues";
import MoveWithCycles from "components/onboarding/move-with-cycles";
import BreakIntoModules from "components/onboarding/break-into-modules";
import UserDetails from "components/onboarding/user-details";
import Workspace from "components/onboarding/workspace";
import InviteMembers from "components/onboarding/invite-members";
import CommandMenu from "components/onboarding/command-menu";
// images
import Logo from "public/onboarding/logo.svg";
import userService from "services/user.service";

const Onboarding: NextPage = () => {
  const [step, setStep] = useState(1);

  const [workspace, setWorkspace] = useState();

  const router = useRouter();

  const { user } = useUser();

  return (
    <DefaultLayout>
      <div className="grid h-full place-items-center p-5">
        {step <= 3 ? (
          <div className="w-full space-y-4">
            <div className="text-center">
              <Image src={Logo} height="40" alt="Plane Logo" />
            </div>
            {step === 1 ? (
              <UserDetails user={user} setStep={setStep} />
            ) : step === 2 ? (
              <Workspace setStep={setStep} setWorkspace={setWorkspace} />
            ) : (
              <InviteMembers setStep={setStep} workspace={workspace} />
            )}
          </div>
        ) : (
          <div className="h-3/5 w-full rounded-lg bg-white px-8 py-10 text-center md:w-1/2">
            <div className="h-3/4 w-full">
              {step === 4 ? (
                <Welcome />
              ) : step === 5 ? (
                <PlanWithIssues />
              ) : step === 6 ? (
                <MoveWithCycles />
              ) : step === 7 ? (
                <BreakIntoModules />
              ) : (
                <CommandMenu />
              )}
            </div>
            <div className="mx-auto flex h-1/4 items-end lg:w-1/2">
              <button
                type="button"
                className="w-full rounded-md bg-gray-200 px-4 py-2 text-sm"
                onClick={() => {
                  if (step === 8) {
                    userService
                      .updateUserOnBoard()
                      .then(() => {
                        router.push("/");
                      })
                      .catch((err) => {
                        console.log(err);
                      });
                  } else setStep((prevData) => prevData + 1);
                }}
              >
                {step === 4 || step === 8 ? "Get Started" : "Next"}
              </button>
            </div>
          </div>
        )}
      </div>
    </DefaultLayout>
  );
};

export const getServerSideProps = async (ctx: NextPageContext) => {
  const user = await requiredAuth(ctx.req?.headers.cookie);

  const redirectAfterSignIn = ctx.req?.url;

  if (!user) {
    return {
      redirect: {
        destination: `/signin?next=${redirectAfterSignIn}`,
        permanent: false,
      },
    };
  }

  return {
    props: {
      user,
    },
  };
};

export default Onboarding;
