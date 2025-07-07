import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// components
import { useTranslation } from "@plane/i18n";
import { DetailedEmptyState } from "@/components/empty-state";
// constants
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";

// TODO: If projectViewId changes, everything breaks. Figure out a better way to handle this.
export const ProfileViewEmptyState: React.FC = observer(() => {
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { profileViewId } = useParams();
  // derived values
  const resolvedPath = useResolvedAssetPath({
    basePath: "/empty-state/profile/",
    additionalPath: profileViewId?.toString(),
  });

  if (!profileViewId) return null;

  return (
    <DetailedEmptyState
      title={t(`profile.empty_state.${profileViewId.toString()}.title`)}
      description={t(`profile.empty_state.${profileViewId.toString()}.description`)}
      assetPath={resolvedPath}
    />
  );
});
