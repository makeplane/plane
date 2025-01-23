import { observer } from "mobx-react";
// helpers
import { calculateI18nTimeAgoShort } from "@/helpers/date-time.helper";
// store types
import { TPageInstance } from "@/store/pages/base-page";
import { useTranslation } from "@plane/i18n";

type Props = {
  page: TPageInstance;
};

export const PageEditInformationPopover: React.FC<Props> = observer((props) => {
  const { page } = props;
  const { t } = useTranslation();
  const { i18n_key, time } = page.updated_at ? calculateI18nTimeAgoShort(page.updated_at) : { i18n_key: "", time: 0 };

  return (
    <div className="flex-shrink-0 whitespace-nowrap">
      <span className="text-sm text-custom-text-300">
        Edited {time}
        {t(i18n_key)}
      </span>
    </div>
  );
});
