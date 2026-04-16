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

import useSWR from "swr";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useStates } from "@/hooks/store/use-state";
// components
import { PageDetailsMainContent } from "@/plane-web/components/pages";
// plane web components
import { PagesNavbarRoot } from "@/plane-web/components/navbar/pages-navbar";

import type { Route } from "./+types/page";

export default function PageDetailsPage(props: Route.ComponentProps) {
  const { params } = props;
  // params
  const { anchor } = params;
  // store hooks
  const { fetchStates } = useStates();
  const { fetchMembers } = useMember();

  useSWR(anchor ? `PUBLIC_STATES_${anchor}` : null, anchor ? () => fetchStates(anchor) : null);
  useSWR(anchor ? `PUBLIC_MEMBERS_${anchor}` : null, anchor ? () => fetchMembers(anchor) : null);

  return (
    <div className="relative flex flex-col size-full overflow-hidden">
      <div className="relative flex h-[60px] shrink-0 items-center border-b border-subtle-1 bg-surface-1">
        <PagesNavbarRoot anchor={anchor} />
      </div>
      <PageDetailsMainContent anchor={params.anchor.toString()} />
    </div>
  );
}
