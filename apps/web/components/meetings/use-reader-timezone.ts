/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useUser } from "@/hooks/store/user";

/** Timezone of the reader's profile. */
export const useReaderTimezone = (): string => {
  const { data } = useUser();
  return data?.user_timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
};
