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

import type { FC, ReactNode } from "react";
import { useEffect } from "react";
import useSWR from "swr";
import { PlaneLogo } from "@plane/propel/icons";
import type { TMobileWorkspaceInvitation } from "@plane/types";
// plane web mobile services
import mobileAuthService from "@/services/mobile.service";

type TMobileAuthInvitationWrapper = {
  invitationId: string | undefined;
  email: string | undefined;
  handleInvitationDetails: (value: TMobileWorkspaceInvitation) => void;
  children: ReactNode;
};

export function MobileAuthInvitationWrapper(props: TMobileAuthInvitationWrapper) {
  // props
  const { invitationId, email, handleInvitationDetails, children } = props;

  // fetching invitation details
  const { data: invitationDetails, isLoading: invitationDetailsLoading } = useSWR(
    invitationId && email ? "MOBILE_WORKSPACE_INVITATION" : null,
    invitationId && email
      ? () => mobileAuthService.fetchWorkspaceInvitation({ invitation_id: invitationId, email: email })
      : null,
    {
      errorRetryInterval: 0,
      errorRetryCount: 0,
      revalidateIfStale: false,
      revalidateOnFocus: false,
    }
  );

  // derived values
  const isLoading =
    (!invitationId && !email && invitationDetailsLoading) || (invitationId && email && invitationDetailsLoading);

  useEffect(() => {
    if (invitationDetails) {
      handleInvitationDetails(invitationDetails);
    }
  }, [invitationDetails, handleInvitationDetails]);

  if (isLoading) {
    return (
      <div className="relative flex justify-center items-center animate-pulse">
        <PlaneLogo className="h-10 w-auto text-accent-primary" />
      </div>
    );
  }

  return <div>{children}</div>;
}
