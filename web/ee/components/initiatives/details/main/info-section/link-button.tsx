"use client";
import React, { FC } from "react";
import { observer } from "mobx-react";
import { Plus } from "lucide-react";
// Plane-web
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";

type Props = {
  customButton?: React.ReactNode;
  disabled?: boolean;
};

export const InitiativeLinksActionButton: FC<Props> = observer((props) => {
  const { customButton, disabled = false } = props;
  // store hooks
  const {
    initiative: {
      initiativeLinks: { setIsLinkModalOpen },
    },
  } = useInitiatives();

  // handlers
  const handleOnClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLinkModalOpen(true);
  };

  return (
    <button type="button" onClick={handleOnClick} disabled={disabled}>
      {customButton ? customButton : <Plus className="h-4 w-4" />}
    </button>
  );
});
