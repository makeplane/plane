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
          Primary:
          <div className="flex flex-wrap">
            <div className="h-12 w-12 bg-custom-primary-0" />
            <div className="h-12 w-12 bg-custom-primary-10" />
            <div className="h-12 w-12 bg-custom-primary-20" />
            <div className="h-12 w-12 bg-custom-primary-30" />
            <div className="h-12 w-12 bg-custom-primary-40" />
            <div className="h-12 w-12 bg-custom-primary-50" />
            <div className="h-12 w-12 bg-custom-primary-60" />
            <div className="h-12 w-12 bg-custom-primary-70" />
            <div className="h-12 w-12 bg-custom-primary-80" />
            <div className="h-12 w-12 bg-custom-primary-90" />
            <div className="h-12 w-12 bg-custom-primary-100" />
            <div className="h-12 w-12 bg-custom-primary-200" />
            <div className="h-12 w-12 bg-custom-primary-300" />
            <div className="h-12 w-12 bg-custom-primary-400" />
            <div className="h-12 w-12 bg-custom-primary-500" />
            <div className="h-12 w-12 bg-custom-primary-600" />
            <div className="h-12 w-12 bg-custom-primary-700" />
            <div className="h-12 w-12 bg-custom-primary-800" />
            <div className="h-12 w-12 bg-custom-primary-900" />
            <div className="h-12 w-12 bg-custom-primary-1000" />
          </div>
        </div>
        <div>
          Background:
          <div className="flex flex-wrap">
            <div className="h-12 w-12 bg-custom-background-0" />
            <div className="h-12 w-12 bg-custom-background-10" />
            <div className="h-12 w-12 bg-custom-background-20" />
            <div className="h-12 w-12 bg-custom-background-30" />
            <div className="h-12 w-12 bg-custom-background-40" />
            <div className="h-12 w-12 bg-custom-background-50" />
            <div className="h-12 w-12 bg-custom-background-60" />
            <div className="h-12 w-12 bg-custom-background-70" />
            <div className="h-12 w-12 bg-custom-background-80" />
            <div className="h-12 w-12 bg-custom-background-90" />
            <div className="h-12 w-12 bg-custom-background-100" />
            <div className="h-12 w-12 bg-custom-background-200" />
            <div className="h-12 w-12 bg-custom-background-300" />
            <div className="h-12 w-12 bg-custom-background-400" />
            <div className="h-12 w-12 bg-custom-background-500" />
            <div className="h-12 w-12 bg-custom-background-600" />
            <div className="h-12 w-12 bg-custom-background-700" />
            <div className="h-12 w-12 bg-custom-background-800" />
            <div className="h-12 w-12 bg-custom-background-900" />
            <div className="h-12 w-12 bg-custom-background-1000" />
          </div>
        </div>
        <div>
          Text:
          <div className="flex flex-wrap">
            <div className="h-12 w-12 bg-custom-text-0" />
            <div className="h-12 w-12 bg-custom-text-10" />
            <div className="h-12 w-12 bg-custom-text-20" />
            <div className="h-12 w-12 bg-custom-text-30" />
            <div className="h-12 w-12 bg-custom-text-40" />
            <div className="h-12 w-12 bg-custom-text-50" />
            <div className="h-12 w-12 bg-custom-text-60" />
            <div className="h-12 w-12 bg-custom-text-70" />
            <div className="h-12 w-12 bg-custom-text-80" />
            <div className="h-12 w-12 bg-custom-text-90" />
            <div className="h-12 w-12 bg-custom-text-100" />
            <div className="h-12 w-12 bg-custom-text-200" />
            <div className="h-12 w-12 bg-custom-text-300" />
            <div className="h-12 w-12 bg-custom-text-400" />
            <div className="h-12 w-12 bg-custom-text-500" />
            <div className="h-12 w-12 bg-custom-text-600" />
            <div className="h-12 w-12 bg-custom-text-700" />
            <div className="h-12 w-12 bg-custom-text-800" />
            <div className="h-12 w-12 bg-custom-text-900" />
            <div className="h-12 w-12 bg-custom-text-1000" />
          </div>
        </div>
        <div>
          Sidebar Background:
          <div className="flex flex-wrap">
            <div className="h-12 w-12 bg-custom-sidebar-background-0" />
            <div className="h-12 w-12 bg-custom-sidebar-background-10" />
            <div className="h-12 w-12 bg-custom-sidebar-background-20" />
            <div className="h-12 w-12 bg-custom-sidebar-background-30" />
            <div className="h-12 w-12 bg-custom-sidebar-background-40" />
            <div className="h-12 w-12 bg-custom-sidebar-background-50" />
            <div className="h-12 w-12 bg-custom-sidebar-background-60" />
            <div className="h-12 w-12 bg-custom-sidebar-background-70" />
            <div className="h-12 w-12 bg-custom-sidebar-background-80" />
            <div className="h-12 w-12 bg-custom-sidebar-background-90" />
            <div className="h-12 w-12 bg-custom-sidebar-background-100" />
            <div className="h-12 w-12 bg-custom-sidebar-background-200" />
            <div className="h-12 w-12 bg-custom-sidebar-background-300" />
            <div className="h-12 w-12 bg-custom-sidebar-background-400" />
            <div className="h-12 w-12 bg-custom-sidebar-background-500" />
            <div className="h-12 w-12 bg-custom-sidebar-background-600" />
            <div className="h-12 w-12 bg-custom-sidebar-background-700" />
            <div className="h-12 w-12 bg-custom-sidebar-background-800" />
            <div className="h-12 w-12 bg-custom-sidebar-background-900" />
            <div className="h-12 w-12 bg-custom-sidebar-background-1000" />
          </div>
        </div>
        <div>
          Sidebar Text:
          <div className="flex flex-wrap">
            <div className="h-12 w-12 bg-custom-sidebar-text-0" />
            <div className="h-12 w-12 bg-custom-sidebar-text-10" />
            <div className="h-12 w-12 bg-custom-sidebar-text-20" />
            <div className="h-12 w-12 bg-custom-sidebar-text-30" />
            <div className="h-12 w-12 bg-custom-sidebar-text-40" />
            <div className="h-12 w-12 bg-custom-sidebar-text-50" />
            <div className="h-12 w-12 bg-custom-sidebar-text-60" />
            <div className="h-12 w-12 bg-custom-sidebar-text-70" />
            <div className="h-12 w-12 bg-custom-sidebar-text-80" />
            <div className="h-12 w-12 bg-custom-sidebar-text-90" />
            <div className="h-12 w-12 bg-custom-sidebar-text-100" />
            <div className="h-12 w-12 bg-custom-sidebar-text-200" />
            <div className="h-12 w-12 bg-custom-sidebar-text-300" />
            <div className="h-12 w-12 bg-custom-sidebar-text-400" />
            <div className="h-12 w-12 bg-custom-sidebar-text-500" />
            <div className="h-12 w-12 bg-custom-sidebar-text-600" />
            <div className="h-12 w-12 bg-custom-sidebar-text-700" />
            <div className="h-12 w-12 bg-custom-sidebar-text-800" />
            <div className="h-12 w-12 bg-custom-sidebar-text-900" />
            <div className="h-12 w-12 bg-custom-sidebar-text-1000" />
          </div>
        </div>
      </div>
    </DefaultLayout>
  </UserAuthorizationLayout>
);

export default Colors;
