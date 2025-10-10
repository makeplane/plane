"use client";
import React from "react";
import { AuthRoot } from "@/components/account/auth-forms/auth-root";
import { EAuthModes } from "@/helpers/authentication.helper";
import { AuthFooter } from "./footer";
import { AuthHeader } from "./header";

type AuthBaseProps = {
  authType: EAuthModes;
};

export const AuthBase = ({ authType }: AuthBaseProps) => (
  <div className="relative z-10 flex flex-col items-center w-screen h-screen overflow-hidden overflow-y-auto pt-6 pb-10 px-8">
    <AuthHeader type={authType} />
    <AuthRoot authMode={authType} />
    <AuthFooter />
  </div>
);
