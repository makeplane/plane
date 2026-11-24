/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: signing out removes the person's push subscriptions on the server. After the next
// sign-in the subscription this browser still has is registered again – only for the account that turned push
// on here (see register.ts). Used by the "New" sidebar item, which every workspace page shows.

import { useEffect } from "react";
import { pushService } from "./push.service";
import { ownSubscription } from "./register";

export const usePushResync = (userId: string | undefined) => {
  useEffect(() => {
    if (!userId) return;
    void ownSubscription(userId)
      .then((subscription) => (subscription ? pushService.subscribe(subscription.toJSON()) : undefined))
      .catch(() => undefined);
  }, [userId]);
};
