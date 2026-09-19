/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
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
        title: "常规设置",
        description: "修改您的实例名称和实例管理员邮箱地址，并启用或停用实例中的遥测功能。",
      }}
    >
      {instance && instanceAdmins && <GeneralConfigurationForm instance={instance} instanceAdmins={instanceAdmins} />}
    </PageWrapper>
  );
}

export const meta: Route.MetaFunction = () => [{ title: "常规设置 - God Mode" }];

export default observer(GeneralPage);
