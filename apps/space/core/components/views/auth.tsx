"use client";

// components
import { AuthRoot } from "@/components/account/auth-forms";
import { PoweredBy } from "@/components/common/powered-by";
// local imports
import { AuthHeader } from "./header";

export const AuthView = () => (
  <div className="relative z-10 flex flex-col items-center w-screen h-screen overflow-hidden overflow-y-auto pt-6 pb-10 px-8">
    <AuthHeader />
    <AuthRoot />
    <PoweredBy />
  </div>
);
