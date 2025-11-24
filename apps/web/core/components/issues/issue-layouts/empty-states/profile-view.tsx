import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// components
import { useTranslation } from "@plane/i18n";
import { EmptyStateDetailed } from "@plane/propel/empty-state";

// TODO: If projectViewId changes, everything breaks. Figure out a better way to handle this.
export const ProfileViewEmptyState = observer(function ProfileViewEmptyState() {
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { profileViewId } = useParams();

  if (!profileViewId) return null;

  return (
    <EmptyStateDetailed
      assetKey="work-item"
      title={t(`profile.empty_state.${profileViewId.toString()}.title`)}
      description={t(`profile.empty_state.${profileViewId.toString()}.description`)}
    />
  );
});
