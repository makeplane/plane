"use client";

import { observer } from "mobx-react";

import { useParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
// plane imports
import { PRODUCT_TOUR_TRACKER_ELEMENTS } from "@plane/constants";
import { PlaneLockup } from "@plane/propel/icons";
import {Avatar, Button } from "@plane/ui";
import { getFileURL } from "@plane/utils";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";

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
    <div className="flex flex-col bg-[#006399] rounded-lg w-[80%] md:w-[60%] md:flex-row">
      <div className="w-full py-6 px-4 flex flex-col gap-4 justify-around md:w-[40%] md:py-9 md:px-8 md:gap-5">
        <div className="font-medium text-white flex items-center gap-1 justify-center md:gap-2">
          <PlaneLockup className="h-5 w-auto md:h-6" />{" "}
          <span className="font-bold text-xl mt-1 md:text-2xl md:mt-2">Business</span>
        </div>
        <div className="space-y-0.5 md:space-y-1">
          <p className="text-white text-center font-medium text-sm md:text-base">Your trial is active now!</p>
          <p className="text-white/60 text-xs text-center md:text-sm">
            Unlock your team&apos;s full potential for 14 days
          </p>
        </div>
        <div className="hidden md:block">
          <img src="/onboarding/tour.webp" className="w-full" alt="Welcome" />
        </div>
        <p className="text-center text-xs text-white/60 md:text-sm">You can use free plan after your trial ends</p>
      </div>
      <div className="w-full p-2 md:w-[60%]">
        <div className="bg-custom-background-100 rounded-lg p-3 px-4 h-full flex flex-col justify-between gap-4 items-start md:p-4 md:px-6 md:gap-6">
          <p className="font-medium text-custom-text-100 text-base md:text-lg">
            Features you&apos;ll get with <span className="text-custom-primary-90">Business</span> plan
          </p>
          <div className="scale-90 md:scale-100 origin-left">
            <Avatar
              src={getFileURL(currentWorkspace.logo_url || "")}
              name={currentWorkspace?.name}
              size={30}
              shape="square"
            />
          </div>
          <p className="text-sm md:text-base">
            <span className="font-medium">{currentWorkspace?.name}</span> workspace with Business
          </p>
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left">
                  <div className="font-bold bg-custom-background-80/50 text-custom-text-300 p-0.5 px-1.5 rounded-md w-fit text-xs md:p-1 md:px-2 md:text-sm">
                    Free
                  </div>
                </th>
                <th className="text-left">{""}</th>
                <th className="text-left">
                  <div className="font-bold bg-custom-background-80 text-custom-text-200 p-0.5 px-1.5 rounded-md w-fit text-xs md:p-1 md:px-2 md:text-sm">
                    Business
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {BUSINESS_FEATURES.map((feature, index) => (
                <tr key={index} className="font-medium">
                  <td className="text-left text-custom-text-400 text-xs py-2 md:text-sm md:py-3">{feature.free}</td>
                  <td className="text-left py-2 md:py-3">
                    <ArrowRight className="h-3 w-3 md:h-4 md:w-4" />
                  </td>
                  <td className="text-left text-custom-text-200 text-xs py-2 md:text-sm md:py-3">{feature.business}</td>
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
