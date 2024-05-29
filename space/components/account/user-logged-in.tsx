"use client";

import Image from "next/image";
// components
import { UserAvatar } from "@/components/issues/navbar/user-avatar";
// hooks
import { useUser } from "@/hooks/store";
// assets
import PlaneLogo from "@/public/plane-logos/black-horizontal-with-blue-logo.png";
import UserLoggedInImage from "@/public/user-logged-in.svg";

export const UserLoggedIn = () => {
  const { data: user } = useUser();

  if (!user) return null;

  return (
    <div className="flex h-screen w-screen flex-col">
      <div className="relative flex w-full items-center justify-between gap-4 border-b border-custom-border-200 px-6 py-5">
        <div>
          <Image src={PlaneLogo} alt="User already logged in" />
        </div>
        <UserAvatar />
      </div>

      <div className="grid h-full w-full place-items-center p-6">
        <div className="text-center">
          <div className="mx-auto grid h-52 w-52 place-items-center rounded-full bg-custom-background-80">
            <div className="h-32 w-32">
              <Image src={UserLoggedInImage} alt="User already logged in" />
            </div>
          </div>
          <h1 className="mt-12 text-3xl font-semibold">Logged in Successfully!</h1>
          <p className="mt-4">
            You{"'"}ve successfully logged in. Please enter the appropriate project URL to view the issue board.
          </p>
        </div>
      </div>
    </div>
  );
};
