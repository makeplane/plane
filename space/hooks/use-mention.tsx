import { useRef, useEffect } from "react";
import { UserService } from "services/user.service";
import useSWR from "swr";
import { IUser } from "@plane/types";

export const useMention = () => {
  const userService = new UserService();
  const { data: user, isLoading: userDataLoading } = useSWR("currentUser", async () => userService.currentUser());

  const userRef = useRef<IUser | undefined>();

  useEffect(() => {
    if (userRef) {
      // @ts-expect-error mismatch in types
      userRef.current = user;
    }
  }, [user]);

  const waitForUserDate = async () =>
    new Promise<IUser>((resolve) => {
      const checkData = () => {
        if (userRef.current) {
          resolve(userRef.current);
        } else {
          setTimeout(checkData, 100);
        }
      };
      checkData();
    });

  const mentionHighlights = async () => {
    if (!userDataLoading && userRef.current) {
      return [userRef.current.id];
    } else {
      const user = await waitForUserDate();
      return [user.id];
    }
  };

  return {
    mentionHighlights,
  };
};
