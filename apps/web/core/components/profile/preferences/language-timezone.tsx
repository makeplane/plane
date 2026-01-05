import { observer } from "mobx-react";
import { SUPPORTED_LANGUAGES, useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { CustomSelect } from "@plane/ui";
import { TimezoneSelect } from "@/components/global";
import { useUser, useUserProfile } from "@/hooks/store/user";

export const LanguageTimezone = observer(function LanguageTimezone() {
  // store hooks
  const {
    data: user,
    updateCurrentUser,
    userProfile: { data: profile },
  } = useUser();
  const { updateUserProfile } = useUserProfile();
  const { t } = useTranslation();

  const handleTimezoneChange = async (value: string) => {
    try {
      await updateCurrentUser({ user_timezone: value });
      setToast({
        title: "Success!",
        message: "Timezone updated successfully",
        type: TOAST_TYPE.SUCCESS,
      });
    } catch (_error) {
      setToast({
        title: "Error!",
        message: "Failed to update timezone",
        type: TOAST_TYPE.ERROR,
      });
    }
  };

  const handleLanguageChange = async (value: string) => {
    try {
      await updateUserProfile({ language: value });
      setToast({
        title: "Success!",
        message: "Language updated successfully",
        type: TOAST_TYPE.SUCCESS,
      });
    } catch (_error) {
      setToast({
        title: "Error!",
        message: "Failed to update language",
        type: TOAST_TYPE.ERROR,
      });
    }
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
              <h4 className="text-14 font-medium text-primary"> {t("timezone")}&nbsp;</h4>
              <p className="text-13 text-secondary">{t("timezone_setting")}</p>
            </div>
            <div className="col-span-12 sm:col-span-6 my-auto">
              <TimezoneSelect value={user?.user_timezone || "Asia/Kolkata"} onChange={handleTimezoneChange} />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex gap-4 sm:gap-16 w-full justify-between">
            <div className="col-span-12 sm:col-span-6">
              <h4 className="text-14 font-medium text-primary"> {t("language")}&nbsp;</h4>
              <p className="text-13 text-secondary">{t("language_setting")}</p>
            </div>
            <div className="col-span-12 sm:col-span-6 my-auto">
              <CustomSelect
                value={profile?.language}
                label={profile?.language ? getLanguageLabel(profile?.language) : "Select a language"}
                onChange={handleLanguageChange}
                buttonClassName={"border-none"}
                className="rounded-md border !border-subtle"
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
