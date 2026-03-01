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

import type { FC } from "react";
import { useMemo } from "react";
import type { IUser } from "@plane/types";

type GetStartedGreetingsViewProps = {
  readonly user: IUser;
};

export const GetStartedGreetingsView: FC<GetStartedGreetingsViewProps> = ({ user }) => {
  const displayName = useMemo(() => {
    const firstName = user.first_name?.trim();
    const lastName = user.last_name?.trim();
    return [firstName, lastName].filter(Boolean).join(" ") || user.display_name || "there";
  }, [user.first_name, user.last_name, user.display_name]);

  return (
    <header className="flex flex-col gap-2">
      <h2 className="text-h3-semibold">Hey {displayName}, welcome aboard! 👋</h2>
      <p className="text-body-xs-regular text-tertiary">
        Here&apos;s everything you need to kickstart your journey with Plane.
      </p>
    </header>
  );
};
