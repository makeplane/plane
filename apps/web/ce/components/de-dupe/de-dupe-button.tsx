import type { FC } from "react";
import React from "react";
// local components

type TDeDupeButtonRoot = {
  workspaceSlug: string;
  isDuplicateModalOpen: boolean;
  handleOnClick: () => void;
  label: string;
};

export function DeDupeButtonRoot(props: TDeDupeButtonRoot) {
  const { workspaceSlug, isDuplicateModalOpen, label, handleOnClick } = props;
  return <></>;
}
