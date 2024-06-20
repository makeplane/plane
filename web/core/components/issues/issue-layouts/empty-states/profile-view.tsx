import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// components
import { EmptyState } from "@/components/empty-state";
// constants
import { EMPTY_STATE_DETAILS } from "@/constants/empty-state";

// assets

export const ProfileViewEmptyState: React.FC = observer(() => {
  // store hooks
  const { profileViewId } = useParams();

  if (!profileViewId) return null;

  const emptyStateType = `profile-${profileViewId.toString()}`;

  return <EmptyState type={emptyStateType as keyof typeof EMPTY_STATE_DETAILS} size="sm" />;
});
