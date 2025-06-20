import { useTranslation } from "@plane/i18n";

export const ChangeLogError = () => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center w-full h-full mb-8">
      <div className="text-lg font-medium">{t("we_are_having_trouble_fetching_the_updates")}</div>
      <div className="text-sm text-custom-text-200">
        {t("please_visit")}
        <a
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
};
