// services
import { UserService } from "@/core/services/user.service";
// core helpers
import { logger } from "@plane/logger";

const userService = new UserService();

type Props = {
  cookie: string;
  userId: string;
};

export const handleAuthentication = async (props: Props) => {
  const { cookie, userId } = props;
  // fetch current user info
  let response;
  try {
    response = await userService.currentUser(cookie);
  } catch (error) {
    logger.error("Failed to fetch current user:", error);
    throw error;
  }
  if (response.id !== userId) {
    throw Error("Authentication failed: Token doesn't match the current user.");
  }

  return {
    user: {
      id: response.id,
      name: response.display_name,
    },
  };
};
