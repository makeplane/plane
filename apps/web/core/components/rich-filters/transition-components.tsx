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

import { Transition } from "@headlessui/react";
import { observer } from "mobx-react";

type ElementTransitionProps = {
  children: React.ReactNode;
  show: boolean;
};

export const ElementTransition = observer(function ElementTransition(props: ElementTransitionProps) {
  return (
    <Transition
      show={props.show}
      enter="transition ease-out duration-200"
      enterFrom="opacity-0 scale-95"
      enterTo="opacity-100 scale-100"
      leave="transition ease-in duration-150"
      leaveFrom="opacity-100 scale-100"
      leaveTo="opacity-0 scale-95"
    >
      {props.children}
    </Transition>
  );
});

type RowTransitionProps = {
  children: React.ReactNode;
  show: boolean;
};

export const RowTransition = observer(function RowTransition(props: RowTransitionProps) {
  return (
    <Transition
      show={props.show}
      enter="transition-all duration-150 ease-out"
      enterFrom="opacity-0 -translate-y-1"
      enterTo="opacity-100 translate-y-0"
      leave="transition-all duration-100 ease-in"
      leaveFrom="opacity-100 translate-y-0"
      leaveTo="opacity-0 -translate-y-1"
    >
      {props.children}
    </Transition>
  );
});
