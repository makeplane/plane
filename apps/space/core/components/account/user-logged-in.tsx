"use client";

import { observer } from "mobx-react";
import Image from "next/image";
import { PlaneLockup } from "@plane/propel/icons";
// components
import { PoweredBy } from "@/components/common/powered-by";
import { UserAvatar } from "@/components/issues/navbar/user-avatar";
// hooks
import { useUser } from "@/hooks/store/use-user";
// assets
import UserLoggedInImage from "@/public/user-logged-in.svg";

export const UserLoggedIn = observer(() => {
  // store hooks
  const { data: user } = useUser();

  if (!user) return null;

  return (
    <div className="flex flex-col h-screen w-screen">
      <div className="relative flex w-full items-center justify-between gap-4 border-b border-custom-border-200 px-6 py-5">
        <PlaneLockup className="h-6 w-auto text-custom-text-100" />
        <UserAvatar />
      </div>

      <div className="size-full grid place-items-center p-6">
        <div className="text-center">
          <div className="mx-auto size-32 md:size-52 grid place-items-center rounded-full bg-custom-background-80">
            <div className="size-16 md:size-32 grid place-items-center">
              <Image src={UserLoggedInImage} alt="User already logged in" />
            </div>
          </div>
          <h1 className="mt-8 md:mt-12 text-xl md:text-3xl font-semibold">Nice! Just one more step.</h1>
          <p className="mt-2 md:mt-4 text-sm md:text-base">
            Enter the public-share URL or link of the view or Page you are trying to see in the browser{"'"}s address
            bar.
          </p>
        </div>
      </div>
      <PoweredBy />
    </div>
  );
});
