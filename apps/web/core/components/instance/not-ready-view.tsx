/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { GOD_MODE_URL } from "@plane/constants";
// assets
import GradientLogo from "@/app/assets/auth/gradient-logo.webp?url";
import GradientBgLogo from "@/app/assets/auth/gradient-bg-logo.webp?url";
import DefaultLayout from "@/layouts/default-layout";
import { Button } from "@plane/propel/button";
import { InstanceBrandMark } from "@/components/brand/instance-brand-mark";
import { useBrand } from "@/hooks/use-brand";

export const InstanceNotReady = observer(function InstanceNotReady() {
  const { name } = useBrand();

  return (
    <DefaultLayout>
      <div className="relative z-10 flex h-screen w-screen overflow-hidden">
        <img
          src={GradientBgLogo}
          className="pointer-events-none absolute -top-24 -left-32 h-56 w-96 opacity-15"
          alt=""
          aria-hidden="true"
        />
        <img
          src={GradientBgLogo}
          className="pointer-events-none absolute -right-20 -bottom-16 h-56 w-96 opacity-15"
          alt=""
          aria-hidden="true"
        />
        <div className="flex h-full w-full flex-col items-center px-8 pt-6 pb-10">
          <div className="sticky top-0 flex w-full shrink-0 items-center justify-between gap-6">
            <InstanceBrandMark variant="lockup" className="h-5 w-auto text-primary" />
          </div>
          <div className="flex h-full w-full flex-col items-center justify-center gap-7">
            <div className="flex flex-col items-center gap-11">
              <img src={GradientLogo} className="h-24 w-40 object-contain" alt={`${name} Logo`} />
              <div className="flex max-w-124 flex-col items-center gap-3">
                <h1 className="text-h2-semibold text-primary">Welcome to {name}</h1>
                <p className="text-center text-body-md-regular text-secondary">
                  Set up your instance and create your first workspace to begin managing projects and work.
                </p>
              </div>
            </div>
            <a href={GOD_MODE_URL} className="w-72">
              <Button variant="primary" className="w-full" size="xl">
                Get started
              </Button>
            </a>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
});
