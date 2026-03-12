/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { ComponentType, ReactNode } from "react";
import { Button } from "../../button";
import { PlaneLockup } from "../../icons";

type LinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
};

type InstanceNotReadyProps = {
  gradientLogoSrc: string;
  gradientBgLogoSrc: string;
  getStartedHref: string;
  linkComponent?: ComponentType<LinkProps>;
};

function DefaultLink({ href, children, className }: LinkProps) {
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

export function InstanceNotReady({
  gradientLogoSrc,
  gradientBgLogoSrc,
  getStartedHref,
  linkComponent: Link = DefaultLink,
}: InstanceNotReadyProps) {
  return (
    <div className="relative z-10 flex w-screen h-screen overflow-hidden">
      {/* Background decorations */}
      <img
        src={gradientBgLogoSrc}
        className="pointer-events-none absolute -top-24 -left-32 h-56 w-96 opacity-15"
        alt=""
        aria-hidden="true"
      />
      <img
        src={gradientBgLogoSrc}
        className="pointer-events-none absolute -bottom-16 -right-20 h-56 w-96 opacity-15"
        alt=""
        aria-hidden="true"
      />
      {/* Main content */}
      <div className="flex flex-col items-center w-full h-full pt-6 pb-10 px-8">
        <div className="flex items-center justify-between gap-6 w-full shrink-0 sticky top-0">
          <Link href="/">
            <PlaneLockup height={20} width={95} className="text-primary" />
          </Link>
        </div>
        <div className="flex flex-col items-center justify-center gap-7 h-full w-full">
          <div className="flex flex-col items-center gap-11">
            <img src={gradientLogoSrc} className="h-24 w-40 object-contain" alt="Plane Logo" />
            <div className="flex flex-col items-center gap-3 max-w-124">
              <h1 className="text-h2-semibold text-primary">Welcome to Plane</h1>
              <p className="text-body-md-regular text-center text-secondary">
                Set up your instance and create your first workspace to begin managing projects and work.
              </p>
            </div>
          </div>
          <Link href={getStartedHref} className="w-72">
            <Button variant="primary" className="w-full" size="xl">
              Get started
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
