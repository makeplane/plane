"use client";

import type { ReactNode } from "react";
// components
import { CommandPalette } from "@/components/command-palette";
// wrappers
import { AuthenticationWrapper } from "@/lib/wrappers/authentication-wrapper";
// layout
import { ProfileLayoutSidebar } from "./sidebar";

import { Outlet } from "react-router";
import type { Route } from "../+types/layout";

export default function ProfileSettingsLayout() {
  return (
    <>
      <CommandPalette />
      <AuthenticationWrapper>
        <div className="relative flex h-full w-full overflow-hidden rounded-lg border border-custom-border-200">
          <ProfileLayoutSidebar />
          <main className="relative flex h-full w-full flex-col overflow-hidden bg-custom-background-100">
            <div className="h-full w-full overflow-hidden">
              <Outlet />
            </div>
          </main>
        </div>
      </AuthenticationWrapper>
    </>
  );
}
