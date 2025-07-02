import { observer } from "mobx-react";
import { SUPPORTED_LANGUAGES, useTranslation } from "@plane/i18n";
import { CustomSelect, TOAST_TYPE, setToast } from "@plane/ui";
import { TimezoneSelect } from "@/components/global";
import { useUser, useUserProfile } from "@/hooks/store";

export const LanguageTimezone = observer(() => {
  // store hooks
  const {
    data: user,
    updateCurrentUser,
    userProfile: { data: profile },
  } = useUser();
  const { updateUserProfile } = useUserProfile();
  const { t } = useTranslation();

  const handleTimezoneChange = (value: string) => {
    updateCurrentUser({ user_timezone: value })
      .then(() => {
        setToast({
          title: "Success!",
          message: "Timezone updated successfully",
          type: TOAST_TYPE.SUCCESS,
        });
      })
      .catch(() => {
        setToast({
          title: "Error!",
          message: "Failed to update timezone",
          type: TOAST_TYPE.ERROR,
        });
      });
  };
  const handleLanguageChange = (value: string) => {
    updateUserProfile({ language: value })
      .then(() => {
        setToast({
          title: "Success!",
          message: "Language updated successfully",
          type: TOAST_TYPE.SUCCESS,
        });
      })
      .catch(() => {
        setToast({
          title: "Error!",
          message: "Failed to update language",
          type: TOAST_TYPE.ERROR,
        });
      });
  };

  const getLanguageLabel = (value: string) => {
    const selectedLanguage = SUPPORTED_LANGUAGES.find((l) => l.value === value);
    if (!selectedLanguage) return value;
    return selectedLanguage.label;
  };

  return (
    <div className="py-6">
      <div className="flex flex-col gap-x-6 gap-y-6">
        <div className="flex flex-col gap-1">
          <div className="flex gap-4 sm:gap-16 w-full justify-between">
            <div className="col-span-12 sm:col-span-6">
              <h4 className="text-base font-medium text-custom-text-100"> {t("timezone")}&nbsp;</h4>
              <p className="text-sm text-custom-text-200">{t("timezone_setting")}</p>
            </div>
            <div className="col-span-12 sm:col-span-6 my-auto">
              <TimezoneSelect value={user?.user_timezone || "Asia/Kolkata"} onChange={handleTimezoneChange} />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex gap-4 sm:gap-16 w-full justify-between">
            <div className="col-span-12 sm:col-span-6">
              <h4 className="text-base font-medium text-custom-text-100"> {t("language")}&nbsp;</h4>
              <p className="text-sm text-custom-text-200">{t("language_setting")}</p>
            </div>
            <div className="col-span-12 sm:col-span-6 my-auto">
              <CustomSelect
                value={profile?.language}
                label={profile?.language ? getLanguageLabel(profile?.language) : "Select a language"}
                onChange={handleLanguageChange}
                buttonClassName={"border-none"}
                className="rounded-md border !border-custom-border-200"
                optionsClassName="w-full"
                input
              >
                {SUPPORTED_LANGUAGES.map((item) => (
                  <CustomSelect.Option key={item.value} value={item.value}>
                    {item.label}
                  </CustomSelect.Option>
                ))}
              </CustomSelect>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
