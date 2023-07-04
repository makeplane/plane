import React from "react";

// layouts
import DefaultLayout from "layouts/default-layout";
import { UserAuthorizationLayout } from "layouts/auth-layout/user-authorization-wrapper";
// types
import type { NextPage } from "next";

const Colors: NextPage = () => (
  <UserAuthorizationLayout>
    <DefaultLayout>
      <div className="space-y-8 p-8">
        <div>
          Accent:
          <div className="flex flex-wrap">
            <div className="h-12 w-12 bg-custom-accent-10" />
            <div className="h-12 w-12 bg-custom-accent-20" />
            <div className="h-12 w-12 bg-custom-accent-30" />
            <div className="h-12 w-12 bg-custom-accent-40" />
            <div className="h-12 w-12 bg-custom-accent-50" />
            <div className="h-12 w-12 bg-custom-accent-60" />
            <div className="h-12 w-12 bg-custom-accent-70" />
            <div className="h-12 w-12 bg-custom-accent-80" />
            <div className="h-12 w-12 bg-custom-accent-90" />
            <div className="h-12 w-12 bg-custom-accent-100" />
            <div className="h-12 w-12 bg-custom-accent-200" />
            <div className="h-12 w-12 bg-custom-accent-300" />
            <div className="h-12 w-12 bg-custom-accent-400" />
            <div className="h-12 w-12 bg-custom-accent-500" />
            <div className="h-12 w-12 bg-custom-accent-600" />
            <div className="h-12 w-12 bg-custom-accent-700" />
            <div className="h-12 w-12 bg-custom-accent-800" />
            <div className="h-12 w-12 bg-custom-accent-900" />
            <div className="h-12 w-12 bg-custom-accent-950" />
          </div>
        </div>
        <div>
          Background:
          <div className="flex flex-wrap">
            <div className="h-12 w-12 bg-custom-bg-10" />
            <div className="h-12 w-12 bg-custom-bg-20" />
            <div className="h-12 w-12 bg-custom-bg-30" />
            <div className="h-12 w-12 bg-custom-bg-40" />
            <div className="h-12 w-12 bg-custom-bg-50" />
            <div className="h-12 w-12 bg-custom-bg-60" />
            <div className="h-12 w-12 bg-custom-bg-70" />
            <div className="h-12 w-12 bg-custom-bg-80" />
            <div className="h-12 w-12 bg-custom-bg-90" />
            <div className="h-12 w-12 bg-custom-bg-100" />
            <div className="h-12 w-12 bg-custom-bg-200" />
            <div className="h-12 w-12 bg-custom-bg-300" />
            <div className="h-12 w-12 bg-custom-bg-400" />
            <div className="h-12 w-12 bg-custom-bg-500" />
            <div className="h-12 w-12 bg-custom-bg-600" />
            <div className="h-12 w-12 bg-custom-bg-700" />
            <div className="h-12 w-12 bg-custom-bg-800" />
            <div className="h-12 w-12 bg-custom-bg-900" />
            <div className="h-12 w-12 bg-custom-bg-950" />
          </div>
        </div>
        <div>
          Sidebar background:
          <div className="flex flex-wrap">
            <div className="h-12 w-12 bg-custom-sidebar-10" />
            <div className="h-12 w-12 bg-custom-sidebar-20" />
            <div className="h-12 w-12 bg-custom-sidebar-30" />
            <div className="h-12 w-12 bg-custom-sidebar-40" />
            <div className="h-12 w-12 bg-custom-sidebar-50" />
            <div className="h-12 w-12 bg-custom-sidebar-60" />
            <div className="h-12 w-12 bg-custom-sidebar-70" />
            <div className="h-12 w-12 bg-custom-sidebar-80" />
            <div className="h-12 w-12 bg-custom-sidebar-90" />
            <div className="h-12 w-12 bg-custom-sidebar-100" />
            <div className="h-12 w-12 bg-custom-sidebar-200" />
            <div className="h-12 w-12 bg-custom-sidebar-300" />
            <div className="h-12 w-12 bg-custom-sidebar-400" />
            <div className="h-12 w-12 bg-custom-sidebar-500" />
            <div className="h-12 w-12 bg-custom-sidebar-600" />
            <div className="h-12 w-12 bg-custom-sidebar-700" />
            <div className="h-12 w-12 bg-custom-sidebar-800" />
            <div className="h-12 w-12 bg-custom-sidebar-900" />
            <div className="h-12 w-12 bg-custom-sidebar-950" />
          </div>
        </div>
      </div>
    </DefaultLayout>
  </UserAuthorizationLayout>
);

export default Colors;
