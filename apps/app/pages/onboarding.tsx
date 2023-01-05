// react
import { useState } from "react";
// next
import { useRouter } from "next/router";
// layouts
import DefaultLayout from "layouts/DefaultLayout";
// components
import Welcome from "components/onboarding/welcome";
import PlanWithIssues from "components/onboarding/plan-with-issues";
import MoveWithCycles from "components/onboarding/move-with-cycles";
import BreakIntoModules from "components/onboarding/break-into-modules";

const Onboarding = () => {
  const [step, setStep] = useState(1);

  const router = useRouter();

  return (
    <DefaultLayout>
      <div className="grid h-full place-items-center p-5">
        <div className="h-3/4 w-full space-y-4 rounded-lg bg-white p-8 text-center md:w-1/2">
          <div className="h-3/4 w-full">
            {step === 1 ? (
              <Welcome />
            ) : step === 2 ? (
              <PlanWithIssues />
            ) : step === 3 ? (
              <MoveWithCycles />
            ) : step === 4 ? (
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
      </div>
    </DefaultLayout>
  );
};

export default Onboarding;
