"use client";
import React, { FC } from "react";
// local components

type TDeDupeButtonRoot = {
  workspaceSlug: string;
  isDuplicateModalOpen: boolean;
  handleOnClick: () => void;
  label: string;
};

export const DeDupeButtonRoot: FC<TDeDupeButtonRoot> = (props) => {
  const { workspaceSlug, isDuplicateModalOpen, label, handleOnClick } = props;
  return <></>;
};
