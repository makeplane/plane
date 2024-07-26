import { useRef, useEffect } from "react";
import useSWR from "swr";
// types
import { IUser } from "@plane/types";
// services
import { UserService } from "@/services/user.service";

export const useMention = () => {
  const userService = new UserService();
  const { data: user, isLoading: userDataLoading } = useSWR("currentUser", async () => userService.currentUser());

  const userRef = useRef<IUser | undefined>();

  useEffect(() => {
    if (userRef) {
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
