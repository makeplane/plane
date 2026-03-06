/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useRouter } from "@/app/compat/next/navigation";
import { LogoSpinner } from "@/components/common/logo-spinner";
import { useUser } from "@/hooks/store";
import { useInstanceFeatureFlags } from "@/plane-admin/hooks/store/use-instance-feature-flag";
import { observer } from "mobx-react";
import { useEffect } from "react";
import type { FC } from "react";
import useSWR from "swr";

type Props = {
  children: React.ReactNode;
};

export const InstanceAdminAuthWrapper: FC<Props> = observer(function InstanceAdminAuthWrapper(props: Props) {
  // props
  const { children } = props;
  // router
  const { replace } = useRouter();
  // store hooks
  const { isUserLoggedIn } = useUser();
  // plane admin hooks
  const { fetchInstanceFeatureFlags } = useInstanceFeatureFlags();
  // fetching instance feature flags
  const { isLoading: flagsLoader, error: flagsError } = useSWR(
    `INSTANCE_FEATURE_FLAGS`,
    () => fetchInstanceFeatureFlags(),
    { revalidateOnFocus: false, revalidateIfStale: false, errorRetryCount: 1 }
  );

  useEffect(() => {
    if (isUserLoggedIn === false) replace("/");
  }, [replace, isUserLoggedIn]);

  if ((flagsLoader && !flagsError) || isUserLoggedIn === undefined) {
    return (
      <div className="relative flex h-screen w-full items-center justify-center">
        <LogoSpinner />
      </div>
    );
  }

  if (isUserLoggedIn) return <>{children}</>;

  return <></>;
});
