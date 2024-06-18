"use client";

import { observer } from "mobx-react-lite";
import Image from "next/image";
import { useTheme } from "next-themes";
// components
import { UserAvatar } from "@/components/issues";
// hooks
import { useUser } from "@/hooks/store";
// assets
import PlaneBlackLogo from "@/public/plane-logos/black-horizontal-with-blue-logo.png";
import PlaneWhiteLogo from "@/public/plane-logos/white-horizontal-with-blue-logo.png";
import UserLoggedInImage from "@/public/user-logged-in.svg";

export const UserLoggedIn = observer(() => {
  // store hooks
  const { data: user } = useUser();
  // next-themes
  const { resolvedTheme } = useTheme();

  const logo = resolvedTheme === "dark" ? PlaneWhiteLogo : PlaneBlackLogo;

  if (!user) return null;

  return (
    <div className="flex flex-col h-screen w-screen">
      <div className="relative flex w-full items-center justify-between gap-4 border-b border-custom-border-200 px-6 py-5">
        <div className="h-[30px] w-[133px]">
          <Image src={logo} alt="Plane logo" />
        </div>
        <UserAvatar />
      </div>

      <div className="size-full grid place-items-center p-6">
        <div className="text-center">
          <div className="mx-auto size-52 grid place-items-center rounded-full bg-custom-background-80">
            <div className="size-32">
              <Image src={UserLoggedInImage} alt="User already logged in" />
            </div>
          </div>
          <h1 className="mt-12 text-3xl font-semibold">Logged in successfully!</h1>
          <p className="mt-4">
            You{"'"}ve successfully logged in. Please enter the appropriate project URL to view the issue board.
          </p>
        </div>
      </div>
    </div>
  );
});
