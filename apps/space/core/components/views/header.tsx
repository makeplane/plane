"use client";

import React from "react";
import Link from "next/link";
import { PlaneLockup } from "@plane/propel/icons";

export const AuthHeader = () => (
  <div className="flex items-center justify-between gap-6 w-full flex-shrink-0 sticky top-0">
    <Link href="/">
      <PlaneLockup height={20} width={95} className="text-custom-text-100" />
    </Link>
  </div>
);
