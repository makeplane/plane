/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
import { useEffect } from "react";
import { observer } from "mobx-react";
import useSWR, { preload } from "swr";
import { PROJECT_DETAILS } from "@plane/constants";
// components
import { LogoSpinner } from "@/components/common/logo-spinner";
import { InstanceNotReady, MaintenanceView } from "@/components/instance";
// hooks
import { useInstance } from "@/hooks/store/use-instance";
import { useProject } from "@/hooks/store/use-project";
import { useUser } from "@/hooks/store/user";

type TInstanceWrapper = {
  children: ReactNode;
};

const InstanceWrapper = observer(function InstanceWrapper(props: TInstanceWrapper) {
  const { children } = props;
  // store
  const { isLoading, instance, error, fetchInstanceInfo } = useInstance();
  const { fetchCurrentUser } = useUser();
  const { fetchProjectDetails } = useProject();

  // Ask for the current user together with the instance, not after it: AuthenticationWrapper (a child,
  // rendered only once the instance is loaded) uses the preloaded result through the same SWR key.
  // Safe for signed-out visitors: fetchCurrentUser asks /users/me/ without the 401 redirect and asks the
  // profile, settings and workspaces only for a signed-in user.
  // On a project page, the project details (what ProjectAuthWrapper waits for before it renders) start as
  // soon as the user is known, instead of after the workspace wrappers; same SWR key as project-wrapper.tsx.
  // Only on the first mount (a full page load).
  useEffect(() => {
    const quiet = <T,>(request: Promise<T>) => (request.catch(() => undefined), request); // no unhandled rejection if unused
    const user = quiet(fetchCurrentUser());
    void preload("USER_INFORMATION", () => user);
    const match = window.location.pathname.match(/^\/([^/]+)\/projects\/([0-9a-f-]{36})\//);
    if (match) {
      const [, slug, projectId] = match;
      void preload(PROJECT_DETAILS(slug, projectId), () =>
        quiet(
          user.then((currentUser) => {
            if (!currentUser?.id) throw new Error("not signed in");
            return fetchProjectDetails(slug, projectId);
          })
        )
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { isLoading: isInstanceSWRLoading, error: instanceSWRError } = useSWR(
    "INSTANCE_INFORMATION",
    async () => await fetchInstanceInfo(),
    { revalidateOnFocus: false }
  );

  // loading state
  if ((isLoading || isInstanceSWRLoading) && !instance)
    return (
      <div className="relative flex h-screen w-full items-center justify-center">
        <LogoSpinner />
      </div>
    );

  if (instanceSWRError) return <MaintenanceView />;

  // something went wrong while in the request
  if (error && error?.status === "error") return <>{children}</>;

  // instance is not ready and setup is not done
  if (instance?.is_setup_done === false) return <InstanceNotReady />;

  return <>{children}</>;
});

export default InstanceWrapper;
