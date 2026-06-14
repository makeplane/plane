/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// components
import { PageWrapper } from "@/components/common/page-wrapper";
// hooks
import { useInstance } from "@/hooks/store";
// local imports
import { GeneralConfigurationForm } from "./form";
// types
import type { Route } from "./+types/page";

function GeneralPage() {
  const { instance, instanceAdmins } = useInstance();

  return (
    <PageWrapper
      header={{
        title: "Общие настройки",
        description:
          "Измените название вашего экземпляра и адреса эл. почты администраторов экземпляра. Включите или отключите телеметрию в вашем экземпляре.",
      }}
    >
      {instance && instanceAdmins && <GeneralConfigurationForm instance={instance} instanceAdmins={instanceAdmins} />}
    </PageWrapper>
  );
}

export const meta: Route.MetaFunction = () => [{ title: "Общие настройки - God Mode" }];

export default observer(GeneralPage);
