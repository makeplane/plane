import { observer } from "mobx-react";
// plane imports
import { ETemplateType } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Loader } from "@plane/ui";
import { getTemplateI18nLabel } from "@plane/utils";

type TemplateListWrapperProps = {
  type: ETemplateType;
  isInitializing: boolean;
  templateIds: string[];
  children: React.ReactNode;
};

export const TemplateListWrapper = observer((props: TemplateListWrapperProps) => {
  const { type, isInitializing, templateIds, children } = props;
  // plane hooks
  const { t } = useTranslation();
  // derived values
  const areTemplatesAvailable = templateIds.length > 0;

  if (!isInitializing && !areTemplatesAvailable) return null;
  return (
    <div className="flex flex-col gap-4 w-full">
      <h3 className="text-sm font-semibold text-custom-text-400">{t(getTemplateI18nLabel(type))}</h3>
      <div className="flex flex-col gap-4">
        {isInitializing ? (
          <Loader className="flex flex-col gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Loader.Item key={index} height="70px" />
            ))}
          </Loader>
        ) : (
          children
        )}
      </div>
    </div>
  );
});
