"use client";

import { observer } from "mobx-react";

type Props = {
  handleRemove: (val: string) => void;
  values: string[];
  editable: boolean | undefined;
};

export const AppliedIssueTypeFilters: React.FC<Props> = observer(() => null);
