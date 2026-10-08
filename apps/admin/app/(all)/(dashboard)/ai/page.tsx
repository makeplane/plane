/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import useSWR from "swr";
// components
import { PageWrapper } from "@/components/common/page-wrapper";
import { Skeleton } from "@/components/common/skeleton";
// hooks
import { useInstance } from "@/hooks/store";
// types
import type { Route } from "./+types/page";
// local
import { InstanceAIForm } from "./form";

const InstanceAIPage = observer(function InstanceAIPage(_props: Route.ComponentProps) {
  // store
  const { fetchInstanceConfigurations, formattedConfig } = useInstance();

  useSWR("INSTANCE_CONFIGURATIONS", () => fetchInstanceConfigurations());

  return (
    <PageWrapper
      header={{
        title: "AI features for all your workspaces",
        description: "Configure your AI API credentials so Plane AI features are turned on for all your workspaces.",
      }}
    >
      {formattedConfig ? (
        <InstanceAIForm config={formattedConfig} />
      ) : (
        <Skeleton className="space-y-8">
          <Skeleton.Item height="50px" width="40%" />
          <div className="grid w-2/3 grid-cols-2 gap-x-8 gap-y-4">
            <Skeleton.Item height="50px" />
            <Skeleton.Item height="50px" />
          </div>
          <Skeleton.Item height="50px" width="20%" />
        </Skeleton>
      )}
    </PageWrapper>
  );
});

export const meta: Route.MetaFunction = () => [{ title: "Artificial Intelligence Settings - God Mode" }];

export default InstanceAIPage;
