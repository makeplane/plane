import React from "react";

// layouts
import DefaultLayout from "layouts/default-layout";
import { UserAuthorizationLayout } from "layouts/auth-layout-legacy/user-authorization-wrapper";
// components
import { CalendarView } from "components/issues";
// types
import type { NextPage } from "next";

const OnBoard: NextPage = () => (
  <UserAuthorizationLayout>
    <DefaultLayout>
      <CalendarView />
    </DefaultLayout>
  </UserAuthorizationLayout>
);

export default OnBoard;
