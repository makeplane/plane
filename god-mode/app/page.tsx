"use client";

import useSWR from "swr";
import useSWRImmutable from "swr/immutable";
// hooks
import useUser from "hooks/use-user";
import useInstance from "hooks/use-instance";
// components
import { GeneralView } from "components/views";

export default function Home() {
  const {
    // isUserInstanceAdmin,
    fetchCurrentUser,
    fetchCurrentUserInstanceAdminStatus,
  } = useUser();
  const { fetchInstanceInfo, fetchInstanceAdmins } = useInstance();

  // fetching user information
  useSWR("CURRENT_USER_DETAILS", () => fetchCurrentUser(), {
    shouldRetryOnError: false,
  });
  // fetching current user instance admin status
  useSWRImmutable(
    "CURRENT_USER_INSTANCE_ADMIN_STATUS",
    () => fetchCurrentUserInstanceAdminStatus(),
    {
      shouldRetryOnError: false,
    }
  );
  // fetching instance information
  useSWR("INSTANCE_INFO", () => fetchInstanceInfo());
  // fetching instance admins
  useSWR("INSTANCE_ADMINS", () => fetchInstanceAdmins());

  return (
    <div className="flex">
      <GeneralView />
    </div>
  );
}
