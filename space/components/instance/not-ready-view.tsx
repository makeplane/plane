"use client";

import { FC } from "react";
import Image from "next/image";
// ui
import { Button } from "@plane/ui";
// helper
import { ADMIN_BASE_URL, ADMIN_BASE_PATH } from "@/helpers/common.helper";
// images
import PlaneTakeOffImage from "@/public/instance/plane-takeoff.png";

export const InstanceNotReady: FC = () => {
  const GOD_MODE_URL = encodeURI(ADMIN_BASE_URL + ADMIN_BASE_PATH);

  return (
    <div className="h-full w-full relative container px-5 mx-auto flex justify-center items-center pt-12">
      <div className="w-auto max-w-2xl relative space-y-8 py-10">
        <div className="relative flex flex-col justify-center items-center space-y-4">
          <h1 className="text-3xl font-bold pb-3">Welcome aboard Plane!</h1>
          <Image src={PlaneTakeOffImage} alt="Plane Logo" />
          <p className="font-medium text-base text-onboarding-text-400">
            Get started by setting up your instance and workspace
          </p>
        </div>
        <div>
          <a href={GOD_MODE_URL}>
            <Button size="lg" className="w-full">
              Get started
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
};
