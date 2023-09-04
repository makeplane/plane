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
    <div className="h-screen w-screen flex flex-col">
      <div className="px-6 py-5 relative w-full flex items-center justify-between gap-4 border-b border-custom-border-200">
        <div>
          <Image src={PlaneLogo} alt="User already logged in" />
        </div>
        <div className="border border-custom-border-200 rounded flex items-center gap-2 p-2">
          {user.avatar && user.avatar !== "" ? (
            <div className="h-5 w-5 rounded-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={user.avatar} alt={user.display_name ?? ""} className="rounded-full" />
            </div>
          ) : (
            <div className="bg-custom-background-80 h-5 w-5 rounded-full grid place-items-center text-[10px] capitalize">
              {(user.display_name ?? "U")[0]}
            </div>
          )}
          <h6 className="text-xs font-medium">{user.display_name}</h6>
        </div>
      </div>

      <div className="h-full w-full grid place-items-center p-6">
        <div className="text-center">
          <div className="h-52 w-52 bg-custom-background-80 rounded-full grid place-items-center mx-auto">
            <div className="h-32 w-32">
              <Image src={UserLoggedInImage} alt="User already logged in" />
            </div>
          </div>
          <h1 className="text-3xl font-semibold mt-12">Logged in Successfully!</h1>
          <p className="mt-4">
            You{"'"}ve successfully logged in. Please enter the appropriate project URL to view the issue board.
          </p>
        </div>
      </div>
    </div>
  );
};
