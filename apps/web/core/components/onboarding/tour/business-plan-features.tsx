/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
// plane imports
import { Button } from "@plane/propel/button";
import { PlaneLockup } from "@plane/propel/icons";
import { Avatar } from "@plane/ui";
import { getFileURL } from "@plane/utils";
// hooks
import tourImage from "@/app/assets/onboarding/tour.webp?url";
import { useWorkspace } from "@/hooks/store/use-workspace";

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

export const BusinessPlanFeatures = observer(function BusinessPlanFeatures(props: Props) {
  const { onComplete } = props;
  const { workspaceSlug } = useParams();
  const { getWorkspaceBySlug } = useWorkspace();
  const currentWorkspace = getWorkspaceBySlug(workspaceSlug.toString());

  if (!currentWorkspace) return null;

  return (
    <div className="flex flex-col bg-[#006399] rounded-lg w-[80%] md:w-[60%] md:flex-row">
      <div className="w-full py-6 px-4 flex flex-col gap-4 justify-around md:w-[40%] md:py-9 md:px-8 md:gap-5">
        <div className="font-medium text-on-color flex items-center gap-1 justify-center md:gap-2">
          <PlaneLockup className="h-5 w-auto md:h-6" />{" "}
          <span className="font-bold text-18 mt-1 md:text-20 md:mt-2">Business</span>
        </div>
        <div className="space-y-0.5 md:space-y-1">
          <p className="text-on-color text-center font-medium text-13 md:text-14">Your trial is active now!</p>
          <p className="text-on-color/60 text-11 text-center md:text-13">
            Unlock your team&apos;s full potential for 14 days
          </p>
        </div>
        <div className="hidden md:block">
          <img src={tourImage} className="w-full" alt="Welcome" />
        </div>
        <p className="text-center text-11 text-on-color/60 md:text-13">You can use free plan after your trial ends</p>
      </div>
      <div className="w-full p-2 md:w-[60%]">
        <div className="bg-surface-1 rounded-lg p-3 px-4 h-full flex flex-col justify-between gap-4 items-start md:p-4 md:px-6 md:gap-6">
          <p className="font-medium text-primary text-14 md:text-16">
            Features you&apos;ll get with <span className="text-accent-secondary">Business</span> plan
          </p>
          <div className="scale-90 md:scale-100 origin-left">
            <Avatar
              src={getFileURL(currentWorkspace.logo_url || "")}
              name={currentWorkspace?.name}
              size={30}
              shape="square"
            />
          </div>
          <p className="text-13 md:text-14">
            <span className="font-medium">{currentWorkspace?.name}</span> workspace with Business
          </p>
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left">
                  <div className="font-bold bg-layer-1/50 text-tertiary p-0.5 px-1.5 rounded-md w-fit text-11 md:p-1 md:px-2 md:text-13">
                    Free
                  </div>
                </th>
                <th className="text-left">{""}</th>
                <th className="text-left">
                  <div className="font-bold bg-layer-1 text-secondary p-0.5 px-1.5 rounded-md w-fit text-11 md:p-1 md:px-2 md:text-13">
                    Business
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {BUSINESS_FEATURES.map((feature, index) => (
                <tr key={index} className="font-medium">
                  <td className="text-left text-placeholder text-11 py-2 md:text-13 md:py-3">{feature.free}</td>
                  <td className="text-left py-2 md:py-3">
                    <ArrowRight className="h-3 w-3 md:h-4 md:w-4" />
                  </td>
                  <td className="text-left text-secondary text-11 py-2 md:text-13 md:py-3">{feature.business}</td>
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
