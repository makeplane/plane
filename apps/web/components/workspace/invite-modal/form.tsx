/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import {
  DialogBody,
  DialogDescription,
  DialogHeader,
  DialogHeading,
  DialogMain,
  DialogTitle,
} from "@makeplane/propel/components/dialog";

type TInvitationFormProps = {
  title: string;
  description: React.ReactNode;
  children: React.ReactNode;
  onSubmit: () => void;
  actions: React.ReactNode;
};

export const InvitationForm = observer(function InvitationForm(props: TInvitationFormProps) {
  const { title, description, children, actions, onSubmit } = props;

  return (
    <form className="flex min-h-0 flex-1 flex-col" onSubmit={onSubmit}>
      <DialogMain>
        <DialogHeader>
          <DialogHeading>
            <DialogTitle>{title}</DialogTitle>
            {/* propel `DialogDescription` is a `<p>` by default; the description is typed as a node, so
                the slot renders as a `div`. */}
            {description && <DialogDescription render={<div />}>{description}</DialogDescription>}
          </DialogHeading>
        </DialogHeader>
        <DialogBody tabIndex={0}>{children}</DialogBody>
        {/* The actions row keeps its own layout (add-more link at the start, buttons at the end), so it
            sits inside the main gutter rather than in a `DialogActions` bar. */}
        {actions}
      </DialogMain>
    </form>
  );
});
