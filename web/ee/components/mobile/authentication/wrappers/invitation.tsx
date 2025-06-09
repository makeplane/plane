"use client";

import { FC, ReactNode, useEffect } from "react";
import Image from "next/image";
import useSWR from "swr";
import { TMobileWorkspaceInvitation } from "@plane/types";
// plane web mobile services
import mobileAuthService from "@/plane-web/services/mobile.service";
// assets
import planeLogo from "@/public/plane-logos/blue-without-text.png";

type TMobileAuthInvitationWrapper = {
  invitationId: string | undefined;
  email: string | undefined;
  handleInvitationDetails: (value: TMobileWorkspaceInvitation) => void;
  children: ReactNode;
};

export const MobileAuthInvitationWrapper: FC<TMobileAuthInvitationWrapper> = (props) => {
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
        <div className="relative h-[50px] w-[50px]">
          <Image src={planeLogo} alt="Plane logo" className="object-contain" />
        </div>
      </div>
    );
  }

  return <div>{children}</div>;
};
