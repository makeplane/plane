import { observer } from "mobx-react";
// plane imports
import { USER_TRACKER_ELEMENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// hooks
import { useInstance } from "@/hooks/store/use-instance";

export const ProductUpdatesChangelog = observer(function ProductUpdatesChangelog() {
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { config } = useInstance();
  // derived values
  const changeLogUrl = config?.instance_changelog_url;

  if (changeLogUrl && changeLogUrl !== "") {
    return <iframe src={changeLogUrl} className="w-full h-full" />;
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-full mb-8">
      <div className="text-lg font-medium">{t("we_are_having_trouble_fetching_the_updates")}</div>
      <div className="text-sm text-custom-text-200">
        {t("please_visit")}
        <a
          data-ph-element={USER_TRACKER_ELEMENTS.CHANGELOG_REDIRECTED}
          href="https://go.plane.so/p-changelog"
          target="_blank"
          className="text-sm text-custom-primary-100 font-medium hover:text-custom-primary-200 underline underline-offset-1 outline-none"
        >
          {t("our_changelogs")}
        </a>{" "}
        {t("for_the_latest_updates")}.
      </div>
    </div>
  );
});
