/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// components
import { PageWrapper } from "@/components/common/page-wrapper";
// types
import type { Route } from "./+types/page";
// local
import { WorkspaceCreateForm } from "./form";

const WorkspaceCreatePage = observer(function WorkspaceCreatePage(_props: Route.ComponentProps) {
  return (
    <PageWrapper
      header={{
        title: "Создайте новое рабочее пространство в этом инстансе.",
        description: "После создания рабочего пространства вам нужно будет пригласить пользователей в настройках рабочего пространства.",
      }}
    >
      <WorkspaceCreateForm />
    </PageWrapper>
  );
});

export const meta: Route.MetaFunction = () => [{ title: "Создание рабочего пространства - God Mode" }];

export default WorkspaceCreatePage;
