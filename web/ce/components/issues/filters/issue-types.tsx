"use client";

import React from "react";
import { observer } from "mobx-react";

type Props = {
  appliedFilters: string[] | null;
  handleUpdate: (val: string) => void;
  searchQuery: string;
};

export const FilterIssueTypes: React.FC<Props> = observer(() => null);
