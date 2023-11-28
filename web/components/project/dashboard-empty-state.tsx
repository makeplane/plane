import React from "react";

import Image from "next/image";
import emptyProject from "public/empty-state/empty_project_dashboard.webp";

// ui
import { Button } from "@plane/ui";

type Props = {
  primaryButton: {
    icon?: any;
    text: string;
    onClick: () => void;
  };
  disabled?: boolean;
};

export const DashboardScreenEmptyState: React.FC<Props> = ({ primaryButton, disabled = false }) => (
  <div className=" flex flex-col justify-center items-center h-full w-full ">
    <div className="border rounded-xl border-custom-border-200 px-10 pt-7 pb-20 flex flex-col gap-5 max-w-6xl m-5 md:m-16 shadow-sm">
      <h3 className="font-semibold text-2xl">Overview of your projects, activity, and metrics</h3>
      <h4 className="text-lg">
        When you have created a project and have issues assigned, you will see metrics, activity, and things you care
        about here. This is personalized to your role in projects, so project admins will see more than members.
      </h4>
      <div className="relative w-full max-w-6xl">
        <Image src={emptyProject} className="w-52 sm:w-60" alt={primaryButton?.text} />
      </div>

      <div className="flex justify-center items-start relative">
        <Button
          className="max-w-min m-3"
          size="lg"
          variant="primary"
          onClick={primaryButton.onClick}
          disabled={disabled}
        >
          Start your first project
        </Button>
        <div className="flex max-w-md absolute top-0 left-1/2 ml-28 pb-5">
          <div className="relative w-0 h-0 border-t-[11px] mt-5 border-custom-border-200 border-b-[11px] border-r-[11px] border-y-transparent">
            <div className="absolute top-[-10px] right-[-12px] w-0 h-0 border-t-[10px] border-custom-background-100 border-b-[10px] border-r-[10px] border-y-transparent" />
          </div>
          <div className="border border-custom-border-200 rounded-md bg-custom-background-100">
            <h1 className="p-5">
              <h3 className="font-semibold text-lg">Everything starts with a project in Plane</h3>
              <h4 className="text-sm mt-1">
                A project could be a product’s roadmap, a marketing campaign, or launching a new car.
              </h4>
            </h1>
          </div>
        </div>
      </div>
    </div>
  </div>
);
