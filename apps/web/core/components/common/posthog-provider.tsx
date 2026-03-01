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

import { useEffect, useRef } from "react";
import posthog from "posthog-js";
import { observer } from "mobx-react";
// store hooks
import { useInstance } from "@/hooks/store/use-instance";
import { useUser } from "@/hooks/store/user";

const PostHogProvider = observer(function PostHogProvider() {
  // store hooks
  const { data: user } = useUser();
  const { config } = useInstance();
  // refs
  const isInitializedRef = useRef(false);
  // derived values
  const posthogApiKey = config?.posthog_api_key;
  const posthogHost = config?.posthog_host;
  const isEnabled = Boolean(posthogApiKey);

  useEffect(() => {
    if (!isEnabled || !posthogApiKey || isInitializedRef.current) return;

    posthog.init(posthogApiKey, {
      api_host: posthogHost || "https://us.i.posthog.com",
      person_profiles: "identified_only",
      capture_pageview: true,
      capture_pageleave: true,
      autocapture: false,
      disable_session_recording: true,
    });

    isInitializedRef.current = true;

    return () => {
      if (isInitializedRef.current) {
        posthog.reset();
        isInitializedRef.current = false;
      }
    };
  }, [posthogApiKey, posthogHost, isEnabled]);

  // Identify user when authenticated
  useEffect(() => {
    if (!isInitializedRef.current || !user) return;

    posthog.identify(user.id, {
      email: user.email,
      name: `${user.first_name} ${user.last_name}`.trim(),
      first_name: user.first_name,
      last_name: user.last_name,
      last_login_medium: user.last_login_medium,
      last_login_time: user.last_login_time,
    });
  }, [user]);

  return null;
});

export default PostHogProvider;
