import Image from "next/image";

// mobx
import { useMobxStore } from "lib/mobx/store-provider";
// assets
import UserLoggedInImage from "public/user-logged-in.svg";
import PlaneLogo from "public/plane-logos/black-horizontal-with-blue-logo.svg";

export const UserLoggedIn = () => {
  const { user: userStore } = useMobxStore();
  const user = userStore.currentUser;

  if (!user) return null;

  return (
    <div className="flex h-screen w-screen flex-col">
      <div className="relative flex w-full items-center justify-between gap-4 border-b border-custom-border-200 px-6 py-5">
        <div>
          <Image src={PlaneLogo} alt="User already logged in" />
        </div>
        <div className="flex items-center gap-2 rounded border border-custom-border-200 p-2">
          {user.avatar && user.avatar !== "" ? (
            <div className="h-5 w-5 rounded-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={user.avatar} alt={user.display_name ?? ""} className="rounded-full" />
            </div>
          ) : (
            <div className="grid h-5 w-5 place-items-center rounded-full bg-custom-background-80 text-[10px] capitalize">
              {(user.display_name ?? "U")[0]}
            </div>
          )}
          <h6 className="text-xs font-medium">{user.display_name}</h6>
        </div>
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
