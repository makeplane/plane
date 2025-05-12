"use client";

import { FC } from "react";
import { getButtonStyling } from "@plane/ui";

type TUpgradeEmptyStateButtonProps = {
  workspaceSlug: string;
};

export const UpgradeEmptyStateButton: FC<TUpgradeEmptyStateButtonProps> = () => (
  <a
    className={`${getButtonStyling("primary", "md")} cursor-pointer`}
    href="https://ece39166.sibforms.com/serve/MUIFAPPLJk02NaZT7ZOinKdoKPL351GVFpEmit1jpJixcLlqd3TaulIT9Czmu0yDy_5bqzuVmEu6Y6oUc09X2NIhI88jplFs0G6ARQa6NxHxACHAUtKNQhOmyI7zpC4MLV_E3kkwlwbzguZyKKURADedKgRarGu77LFz6f9CH-DUDntNbrooJhU1-vndV1EyWNrFgvjMDjz2wSat"
    target="_blank"
    rel="noreferrer"
  >
    Stay in loop
  </a>
);
