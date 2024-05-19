"use client";

import { ReactNode } from "react";
import { observer } from "mobx-react-lite";
import Image from "next/image";
import { useTheme } from "next-themes";
import useSWR from "swr";
// components
import { LogoSpinner } from "@/components/common";
import { InstanceFailureView } from "@/components/instance";
// hooks
import { useInstance, useUser } from "@/hooks/store";
// assets
import PlaneBackgroundPatternDark from "public/auth/background-pattern-dark.svg";
import PlaneBackgroundPattern from "public/auth/background-pattern.svg";
import BluePlaneLogoWithoutText from "public/plane-logos/blue-without-text.png";

export const InstanceProvider = observer(({ children }: { children: ReactNode }) => {
  const { fetchInstanceInfo, instance, error } = useInstance();
  const { fetchCurrentUser } = useUser();
  const { resolvedTheme } = useTheme();

  const patternBackground = resolvedTheme === "dark" ? PlaneBackgroundPatternDark : PlaneBackgroundPattern;

  useSWR("INSTANCE_INFO", () => fetchInstanceInfo(), {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    errorRetryCount: 0,
  });
  useSWR("CURRENT_USER", () => fetchCurrentUser());

  if (!instance && !error)
    return (
      <div className="flex h-screen min-h-[500px] w-full justify-center items-center">
        <LogoSpinner />
      </div>
    );

  if (error) {
    return (
      <div className="relative">
        <div className="h-screen w-full overflow-hidden overflow-y-auto flex flex-col">
          <div className="container h-[110px] flex-shrink-0 mx-auto px-5 lg:px-0 flex items-center justify-between gap-5 z-50">
            <div className="flex items-center gap-x-2 py-10">
              <Image src={BluePlaneLogoWithoutText} height={30} width={30} alt="Plane Logo" />
              <span className="text-2xl font-semibold sm:text-3xl">Plane</span>
            </div>
          </div>
          <div className="absolute inset-0 z-0">
            <Image src={patternBackground} className="w-screen h-full object-cover" alt="Plane background pattern" />
          </div>
          <div className="relative z-10 flex-grow">
            <div className="relative h-full w-full overflow-y-auto px-6 py-10 mx-auto flex justify-center items-center">
              <InstanceFailureView />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
});
