import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// constants
import { EMPTY_STATE_DETAILS } from "@plane/constants";
// components
import { EmptyState } from "@/components/empty-state";

export const ProfileViewEmptyState: React.FC = observer(() => {
  // store hooks
  const { profileViewId } = useParams();

  if (!profileViewId) return null;

  const emptyStateType = `profile-${profileViewId.toString()}`;

  return <EmptyState type={emptyStateType as keyof typeof EMPTY_STATE_DETAILS} size="sm" />;
});
