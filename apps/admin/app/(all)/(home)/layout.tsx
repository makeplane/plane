import { useEffect } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/navigation";
import { Outlet } from "react-router";
// hooks
import { useUser } from "@/hooks/store/use-user";

function RootLayout() {
  // router
  const { replace } = useRouter();
  // store hooks
  const { isUserLoggedIn } = useUser();

  useEffect(() => {
    if (isUserLoggedIn === true) replace("/general");
  }, [replace, isUserLoggedIn]);

  return (
    <div className="relative z-10 flex flex-col items-center w-screen h-screen overflow-hidden overflow-y-auto pt-6 pb-10 px-8 bg-surface-1">
      <Outlet />
    </div>
  );
}

export default observer(RootLayout);
