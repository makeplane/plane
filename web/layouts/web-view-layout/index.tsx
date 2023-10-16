import useSWR from "swr";

// services
import { UserService } from "services/user.service";
// fetch keys
import { CURRENT_USER } from "constants/fetch-keys";
// icons
import { AlertCircle } from "lucide-react";
// ui
import { Spinner } from "@plane/ui";

type Props = {
  children: React.ReactNode;
  fullScreen?: boolean;
};

// services
const userService = new UserService();

const getIfInWebview = (userAgent: NavigatorID["userAgent"]) => {
  const safari = /safari/.test(userAgent);

  if (safari) return false;
  else if (/iphone|ipod|ipad/.test(userAgent) || userAgent.includes("wv")) return true;
  else return false;
};

const useMobileDetect = () => {
  const userAgent = typeof navigator === "undefined" ? "SSR" : navigator.userAgent;
  return getIfInWebview(userAgent);
};

const WebViewLayout: React.FC<Props> = ({ children, fullScreen = true }) => {
  const { data: currentUser, error } = useSWR(CURRENT_USER, () => userService.currentUser());

  const isWebview = useMobileDetect();

  if (!currentUser && !error) {
    return (
      <div className="h-screen grid place-items-center p-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <Spinner />
        </div>
      </div>
    );
  }

  return (
    <div className={fullScreen ? "h-screen w-full bg-custom-background-100" : ""}>
      {error || !isWebview ? (
        <div className="flex flex-col items-center justify-center gap-y-3 h-full text-center text-custom-text-200">
          <AlertCircle size={64} />
          <h2 className="text-2xl font-semibold">You are not authorized to view this page.</h2>
        </div>
      ) : (
        children
      )}
    </div>
  );
};

export default WebViewLayout;
