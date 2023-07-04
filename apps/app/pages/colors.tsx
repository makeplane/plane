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
            <div className="h-20 w-20 bg-brand-accent-50" />
            <div className="h-20 w-20 bg-brand-accent-100" />
            <div className="h-20 w-20 bg-brand-accent-200" />
            <div className="h-20 w-20 bg-brand-accent-300" />
            <div className="h-20 w-20 bg-brand-accent-400" />
            <div className="h-20 w-20 bg-brand-accent-500" />
            <div className="h-20 w-20 bg-brand-accent-600" />
            <div className="h-20 w-20 bg-brand-accent-700" />
            <div className="h-20 w-20 bg-brand-accent-800" />
            <div className="h-20 w-20 bg-brand-accent-900" />
          </div>
        </div>
        <div>
          Background:
          <div className="flex flex-wrap">
            <div className="h-20 w-20 bg-brand-bg-50" />
            <div className="h-20 w-20 bg-brand-bg-100" />
            <div className="h-20 w-20 bg-brand-bg-200" />
            <div className="h-20 w-20 bg-brand-bg-300" />
            <div className="h-20 w-20 bg-brand-bg-400" />
            <div className="h-20 w-20 bg-brand-bg-500" />
            <div className="h-20 w-20 bg-brand-bg-600" />
            <div className="h-20 w-20 bg-brand-bg-700" />
            <div className="h-20 w-20 bg-brand-bg-800" />
            <div className="h-20 w-20 bg-brand-bg-900" />
          </div>
        </div>
      </div>
    </DefaultLayout>
  </UserAuthorizationLayout>
);

export default Colors;
