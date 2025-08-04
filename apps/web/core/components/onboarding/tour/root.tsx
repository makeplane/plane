"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Avatar, Button, PlaneLockup } from "@plane/ui";
import { getFileURL } from "@plane/utils";
import { useWorkspace } from "@/hooks/store";

export type TTourSteps = "welcome" | "work-items" | "cycles" | "modules" | "views" | "pages";

const BUSINESS_FEATURES = [
  {
    free: "12 Seats",
    business: "Unlimited Seats",
  },
  {
    free: "Work items only",
    business: "Initiatives and Epics",
  },
  {
    free: "Default workflow",
    business: "Custom workflows and approvals",
  },
  {
    free: "No insights",
    business: "Dashboards and analytics",
  },
  {
    free: "No collaboration",
    business: "Teamspaces and shared pages",
  },
  {
    free: "No tracking",
    business: "Time tracking and reports",
  },
];

type Props = {
  onComplete: () => void;
};

export const TourRoot: React.FC<Props> = observer((props) => {
  const { onComplete } = props;
  const { workspaceSlug } = useParams();
  const { getWorkspaceBySlug } = useWorkspace();
  const currentWorkspace = getWorkspaceBySlug(workspaceSlug.toString());

  if (!currentWorkspace) return null;

  return (
    <div className="flex bg-[#006399] rounded-lg w-[60%]">
      <div className="w-[40%] py-9 px-8 flex flex-col gap-5 justify-around">
        <div className="font-medium text-white flex items-center gap-2 justify-center">
          <PlaneLockup className="h-6 w-auto" /> <span className="font-bold text-2xl mt-2">Business</span>
        </div>
        <div className="space-y-1">
          <p className="text-white text-center font-medium">Your trail is active now!</p>
          <p className="text-white/60 text-sm text-center">Unlock your team&apos;s full potential for 14 days</p>
        </div>
        <div>
          <img src="/onboarding/tour.webp" className="w-full" alt="Welcome" />
        </div>
        <p className="text-center text-sm text-white/60">You can use free plan after your trial ends</p>
      </div>
      <div className="w-[60%] p-2">
        <div className="bg-custom-background-100 rounded-lg p-4 px-6 h-full flex flex-col justify-between gap-6 items-start">
          <p className="font-medium text-custom-text-100 text-lg">
            Features you&apos;ll get with <span className="text-custom-primary-90">Business</span> plan
          </p>
          <Avatar
            src={getFileURL(currentWorkspace.logo_url || "")}
            name={currentWorkspace?.name}
            size={30}
            shape="square"
          />
          <p>
            <span className="font-medium">{currentWorkspace?.name}</span> workspace with Business
          </p>
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left">
                  <div className="font-bold bg-custom-background-80/50 text-custom-text-300 p-1 px-2 rounded-md w-fit text-sm">
                    Free
                  </div>
                </th>
                <th className="text-left">{""}</th>
                <th className="text-left">
                  <div className="font-bold bg-custom-background-80 text-custom-text-200 p-1 px-2 rounded-md w-fit text-sm">
                    Business
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {BUSINESS_FEATURES.map((feature, index) => (
                <tr key={index} className="font-medium">
                  <td className="text-left text-custom-text-400 text-sm py-3">{feature.free}</td>
                  <td className="text-left py-3">
                    <ArrowRight className="h-4 w-4" />
                  </td>
                  <td className="text-left text-custom-text-200 text-sm py-3">{feature.business}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Button onClick={onComplete}>Let&apos;s get started</Button>
        </div>
      </div>
    </div>
  );
});
