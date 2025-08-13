"use client";

import { observer } from "mobx-react";
import { Dialog } from "@plane/ui";

type TInvitationFormProps = {
  title: string;
  description: React.ReactNode;
  children: React.ReactNode;
  onSubmit: () => void;
  actions: React.ReactNode;
  className?: string;
};

export const InvitationForm = observer((props: TInvitationFormProps) => {
  const { title, description, children, actions, onSubmit, className } = props;

  return (
    <form onSubmit={onSubmit} className={className}>
      <div className="space-y-4">
        <Dialog.Title className="text-lg font-medium leading-6 text-custom-text-100">{title}</Dialog.Title>
        <div className="text-sm text-custom-text-200">{description}</div>
        {children}
      </div>
      {actions}
    </form>
  );
});
