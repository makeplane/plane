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

import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { Button } from "@plane/propel/button";
import { API_BASE_URL } from "@plane/constants";
import { PlaneLogo } from "@plane/propel/icons";
// hooks
import { getDesktopAPI, isDesktop } from "@/hooks/use-desktop";

interface TokenExchangeError {
  error?: string;
}

export default function DesktopAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [handedOff, setHandedOff] = useState(false);

  useEffect(() => {
    const token = searchParams.get("token");
    const errorCode = searchParams.get("error_code");
    const errorMessage = searchParams.get("error_message");

    if (errorCode || errorMessage) {
      setError(errorMessage || errorCode || "Authentication failed");
      return;
    }

    if (!token) {
      setError("No authentication token provided");
      return;
    }

    // If we're in a browser (not Electron), redirect to plane:// to hand off to the desktop app
    if (!isDesktop()) {
      setHandedOff(true);
      // Redirect to plane:// protocol - Electron will intercept this and navigate to /d/auth/?token=xxx
      window.location.href = `plane://d/auth/?token=${encodeURIComponent(token)}`;
      return;
    }

    // We're in Electron - exchange the token for a session
    const exchangeToken = async () => {
      try {
        // Retrieve the PKCE code_verifier from the Electron main process
        const planeDesktop = getDesktopAPI();
        const codeVerifier = await planeDesktop.getCodeVerifier();

        const response = await fetch(`${API_BASE_URL}/auth/desktop/token-exchange/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ token, code_verifier: codeVerifier }),
        });

        if (!response.ok) {
          const data = (await response.json()) as TokenExchangeError;
          throw new Error(data.error || "Failed to exchange token");
        }

        // Successfully authenticated, redirect to home
        void navigate("/", { replace: true });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Authentication failed");
      }
    };

    void exchangeToken();
  }, [searchParams, navigate]);

  const handleGoToSignIn = () => {
    void navigate("/", { replace: true });
  };

  if (error) {
    return (
      <InfoSection
        title="Sign in failed"
        description={error || "Something went wrong during authentication. Please try signing in again."}
        action={
          <Button variant="primary" onClick={handleGoToSignIn}>
            Go to Sign In
          </Button>
        }
      />
    );
  }

  // Handed off to desktop app - show success message in browser
  if (handedOff) {
    return <InfoSection title="Sign in complete" description="You can now close this window and go to desktop app." />;
  }

  return <InfoSection title="Signing in" description="Please wait while we complete the sign in process." />;
}

type TInfoSectionProps = {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
};

function InfoSection(props: TInfoSectionProps) {
  const { title, description, action } = props;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-9 bg-surface-1">
      <PlaneLogo className="h-10 w-auto text-primary" />
      <div className="flex flex-col items-center justify-center gap-2">
        <h1 className="text-h1-semibold">{title}</h1>
        <div className="text-body-md-regular text-secondary">{description}</div>
      </div>
      {action && <div className="text-body-md-regular text-secondary">{action}</div>}
    </div>
  );
}
