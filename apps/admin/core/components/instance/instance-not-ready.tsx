"use client";

import type { FC } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@plane/propel/button";
// assets
import AhaMascotImage from "@/public/aha-logos/ahamascot.png";

export const InstanceNotReady: FC = () => (
  <div className="h-full w-full relative container px-5 mx-auto flex justify-center items-center">
    <div className="w-auto max-w-2xl relative space-y-8 py-10">
      <div className="relative flex flex-col justify-center items-center space-y-4">
        <h1 className="text-3xl font-bold pb-3">Welcome aboard AHA Projects!</h1>
        <Image src={AhaMascotImage} alt="AHA Projects mascot" priority />
        <p className="font-medium text-base text-custom-text-400">
          Get started by setting up your instance and workspace
        </p>
      </div>

      <div>
        <Link href={"/setup/?auth_enabled=0"}>
          <Button size="lg" className="w-full bg-[#DA4F36] hover:bg-[#c4462f] focus-visible:ring-[#DA4F36]/40 border-transparent">
            Get started
          </Button>
        </Link>
      </div>
    </div>
  </div>
);
