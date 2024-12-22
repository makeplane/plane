"use client";

import { observer } from "mobx-react";
// components
import { EmptyState } from "@/components/empty-state";
// constants
import { EmptyStateType } from "@/constants/empty-state";

const TeamPagesPage = observer(() => <EmptyState type={EmptyStateType.TEAM_PAGE} />);

export default TeamPagesPage;
