"use client";

import React from "react";
import { observer } from "mobx-react";

type Props = {
  appliedFilters: string[] | null;
  handleUpdate: (val: string) => void;
  searchQuery: string;
};

export const FilterTeamProjects: React.FC<Props> = observer(() => null);
