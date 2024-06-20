"use client";

import { ReactNode } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import useSWR from "swr";
// components
import { LogoSpinner } from "@/components/common";
import { InstanceFailureView } from "@/components/instance";
// helpers
import { SPACE_BASE_PATH } from "@/helpers/common.helper";
// hooks
import { useInstance, useUser } from "@/hooks/store";
// assets
import PlaneBackgroundPatternDark from "public/auth/background-pattern-dark.svg";
import PlaneBackgroundPattern from "public/auth/background-pattern.svg";
import BlackHorizontalLogo from "public/plane-logos/black-horizontal-with-blue-logo.png";
import WhiteHorizontalLogo from "public/plane-logos/white-horizontal-with-blue-logo.png";

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
  useSWR("CURRENT_USER", () => fetchCurrentUser(), {
    shouldRetryOnError: false,
    revalidateOnFocus: false,
    revalidateIfStale: false,
  });

  if (!instance && !error)
    return (
      <div className="flex h-screen min-h-[500px] w-full justify-center items-center">
        <LogoSpinner />
      </div>
    );

  const logo = resolvedTheme === "light" ? BlackHorizontalLogo : WhiteHorizontalLogo;
  if (error) {
    return (
      <div className="relative">
        <div className="h-screen w-full overflow-hidden overflow-y-auto flex flex-col">
          <div className="container h-[110px] flex-shrink-0 mx-auto px-5 lg:px-0 flex items-center justify-between gap-5 z-50">
            <div className="flex items-center gap-x-2 py-10">
              <Link href={`${SPACE_BASE_PATH}/`} className="h-[30px] w-[133px]">
                <Image src={logo} alt="Plane logo" />
              </Link>
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
