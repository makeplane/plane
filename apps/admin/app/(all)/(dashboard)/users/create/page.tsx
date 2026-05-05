/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// components
import { PageWrapper } from "@/components/common/page-wrapper";
import { UserCreateForm } from "@/components/users/user-create-form";
// types
import type { Route } from "./+types/page";

function UserCreatePage(_props: Route.ComponentProps) {
  return (
    <PageWrapper
      header={{
        title: "Create a new user",
        description: "Add a new user to this instance.",
      }}
    >
      <div className="pt-4">
        <UserCreateForm />
      </div>
    </PageWrapper>
  );
}

export const meta: Route.MetaFunction = () => [{ title: "Create User - God Mode" }];

export default UserCreatePage;
