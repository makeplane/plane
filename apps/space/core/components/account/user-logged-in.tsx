import { observer } from "mobx-react";
import { PlaneLockup } from "@plane/propel/icons";
// assets
import UserLoggedInImage from "@/app/assets/user-logged-in.svg?url";
// components
import { PoweredBy } from "@/components/common/powered-by";
import { UserAvatar } from "@/components/issues/navbar/user-avatar";
// hooks
import { useUser } from "@/hooks/store/use-user";

export const UserLoggedIn = observer(function UserLoggedIn() {
  // store hooks
  const { data: user } = useUser();

  if (!user) return null;

  return (
    <div className="flex flex-col h-screen w-screen">
      <div className="relative flex w-full items-center justify-between gap-4 border-b border-subtle px-6 py-5">
        <PlaneLockup className="h-6 w-auto text-primary" />
        <UserAvatar />
      </div>

      <div className="size-full grid place-items-center p-6">
        <div className="text-center">
          <div className="mx-auto size-32 md:size-52 grid place-items-center rounded-full bg-layer-1">
            <div className="size-16 md:size-32 grid place-items-center">
              <img src={UserLoggedInImage} alt="User already logged in" className="w-full h-full object-cover" />
            </div>
          </div>
          <h1 className="mt-8 md:mt-12 text-18 md:text-24 font-semibold">Nice! Just one more step.</h1>
          <p className="mt-2 md:mt-4 text-13 md:text-14">
            Enter the public-share URL or link of the view or Page you are trying to see in the browser{"'"}s address
            bar.
          </p>
        </div>
      </div>
      <PoweredBy />
    </div>
  );
});
