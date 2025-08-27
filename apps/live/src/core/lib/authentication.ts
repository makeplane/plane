import { handleError } from "@/core/helpers/error-handling/error-factory";
// services
import { UserService } from "@/core/services/user.service";

const userService = new UserService();

type Props = {
  cookie: string;
  userId: string;
  workspaceSlug: string;
};

export const handleAuthentication = async (props: Props) => {
  const { cookie, userId, workspaceSlug } = props;
  // fetch current user info
  let response;
  try {
    response = await userService.currentUser(cookie);
  } catch (error) {
    handleError(error, {
      errorType: "unauthorized",
      message: "Failed to authenticate user",
      component: "authentication",
      operation: "fetch-current-user",
      extraContext: {
        userId,
        workspaceSlug,
      },
      throw: true,
    });
  }
  if (response.id !== userId) {
    handleError(null, {
      errorType: "unauthorized",
      message: "Authentication failed: Token doesn't match the current user.",
      component: "authentication",
      operation: "validate-user",
      extraContext: {
        userId,
        workspaceSlug,
      },
      throw: true,
    });
  }

  return {
    user: {
      id: response.id,
      name: response.display_name,
    },
  };
};
