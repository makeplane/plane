// swr
import useSWR from "swr";

// services
import userService from "services/user.service";

// fetch keys
import { CURRENT_USER } from "constants/fetch-keys";

// icons
import { AlertCircle } from "lucide-react";

// ui
import { Spinner } from "components/ui";

type Props = {
  fullScreen?: boolean;
  children: React.ReactNode;
};

const WebViewLayout: React.FC<Props> = ({ children, fullScreen = false }) => {
  const { data: currentUser, error } = useSWR(CURRENT_USER, () => userService.currentUser());

  if (!currentUser && !error) {
    return (
      <div className="h-screen grid place-items-center p-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <h3 className="text-xl">Loading your profile...</h3>
          <Spinner />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${
        fullScreen
          ? "h-screen w-full overflow-hidden bg-custom-background-100"
          : "flex-col blur-none shadow-none backdrop:backdrop-blur-none justify-center items-center"
      }`}
    >
      {error ? (
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
