// react
import { useState } from "react";
// next
import { useRouter } from "next/router";
// hooks
import useUser from "lib/hooks/useUser";
// layouts
import DefaultLayout from "layouts/DefaultLayout";
// components
import Welcome from "components/onboarding/welcome";
import PlanWithIssues from "components/onboarding/plan-with-issues";
import MoveWithCycles from "components/onboarding/move-with-cycles";
import BreakIntoModules from "components/onboarding/break-into-modules";
import UserDetails from "components/onboarding/user-details";
import Workspace from "components/onboarding/workspace";
import InviteMembers from "components/onboarding/invite-members";

const Onboarding = () => {
  const [step, setStep] = useState(1);

  const router = useRouter();

  const { user } = useUser();

  return (
    <DefaultLayout>
      <div className="grid h-full place-items-center p-5">
        {step <= 3 ? (
          step === 1 ? (
            <UserDetails user={user} setStep={setStep} />
          ) : step === 2 ? (
            <Workspace setStep={setStep} />
          ) : (
            <InviteMembers setStep={setStep} />
          )
        ) : (
          <div className="h-3/4 w-full space-y-4 rounded-lg bg-white p-8 text-center md:w-1/2">
            <div className="h-3/4 w-full">
              {step === 4 ? (
                <Welcome />
              ) : step === 5 ? (
                <PlanWithIssues />
              ) : step === 6 ? (
                <MoveWithCycles />
              ) : step === 7 ? (
                <BreakIntoModules />
              ) : null}
            </div>
            <div className="mx-auto h-1/4 lg:w-1/2">
              <button
                type="button"
                className="w-full rounded-md bg-gray-200 px-4 py-2 text-sm"
                onClick={() => {
                  if (step === 5) router.push("/");
                  setStep((prevData) => prevData + 1);
                }}
              >
                {step === 1 || step === 5 ? "Get Started" : "Next"}
              </button>
            </div>
          </div>
        )}
      </div>
    </DefaultLayout>
  );
};

export default Onboarding;
