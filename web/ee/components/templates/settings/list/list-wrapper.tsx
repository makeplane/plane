import { observer } from "mobx-react";
// plane imports
import { ETemplateType } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TLoader } from "@plane/types";
import { Loader } from "@plane/ui";
import { getTemplateI18nLabel } from "@plane/utils";

type TemplateListWrapperProps = {
  type: ETemplateType;
  loaderState: TLoader;
  children: React.ReactNode;
};

export const TemplateListWrapper = observer((props: TemplateListWrapperProps) => {
  const { type, loaderState, children } = props;
  // plane hooks
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-custom-text-400">{t(getTemplateI18nLabel(type))}</h3>
      <div className="flex flex-col gap-4">
        {loaderState === "init-loader" ? (
          <>
            {Array.from({ length: 3 }).map((_, index) => (
              <Loader.Item key={index} height="70px" />
            ))}
          </>
        ) : (
          children
        )}
      </div>
    </div>
  );
});
