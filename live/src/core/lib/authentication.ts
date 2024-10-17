// services
import { UserService } from "@/core/services/user.service.js";
// core helpers
import { manualLogger } from "@/core/helpers/logger.js";

const userService = new UserService();

type Props = {
  cookie: string;
  token: string;
};

export const handleAuthentication = async (props: Props) => {
  const { cookie, token } = props;
  // fetch current user info
  let response;
  try {
    response = await userService.currentUser(cookie);
  } catch (error) {
    manualLogger.error("Failed to fetch current user:", error);
    throw error;
  }
  if (response.id !== token) {
    throw Error("Authentication failed: Token doesn't match the current user.");
  }

  return {
    user: {
      id: response.id,
      name: response.display_name,
    },
  };
};
