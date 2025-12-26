import type { FormEvent } from "react";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";

// plane imports
import { ETabIndices, EPageAccess } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { EmojiPicker, EmojiIconPickerTypes, Logo } from "@plane/propel/emoji-icon-picker";
import { GlobeIcon, LockIcon, PageIcon } from "@plane/propel/icons";
import type { ISvgIcons } from "@plane/propel/icons";
import type { TPage } from "@plane/types";
import { Input } from "@plane/ui";
import { getTabIndex } from "@plane/utils";
// components
import { AccessField } from "@/components/common/access-field";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";

type Props = {
  formData: Partial<TPage>;
  handleFormData: <T extends keyof TPage>(key: T, value: TPage[T]) => void;
  handleModalClose: () => void;
  handleFormSubmit: () => Promise<void>;
};

const PAGE_ACCESS_SPECIFIERS: {
  key: EPageAccess;
  i18n_label: string;
  icon: LucideIcon | React.FC<ISvgIcons>;
}[] = [
  { key: EPageAccess.PUBLIC, i18n_label: "common.access.public", icon: GlobeIcon },
  { key: EPageAccess.PRIVATE, i18n_label: "common.access.private", icon: LockIcon },
];

export function PageForm(props: Props) {
  const { formData, handleFormData, handleModalClose, handleFormSubmit } = props;
  // hooks
  const { isMobile } = usePlatformOS();
  const { t } = useTranslation();
  // state
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const i18n_access_label = PAGE_ACCESS_SPECIFIERS.find((access) => access.key === formData.access)?.i18n_label;

  const { getIndex } = getTabIndex(ETabIndices.PROJECT_PAGE, isMobile);

  const handlePageFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await handleFormSubmit();
      setIsSubmitting(false);
    } catch {
      setIsSubmitting(false);
    }
  };

  const isTitleLengthMoreThan255Character = formData.name ? formData.name.length > 255 : false;

  return (
    <form onSubmit={handlePageFormSubmit}>
      <div className="space-y-5 p-5">
        <h3 className="text-18 font-medium text-secondary">Create page</h3>
        <div className="flex items-start gap-2 h-9 w-full">
          <EmojiPicker
            isOpen={isOpen}
            handleToggle={(val: boolean) => setIsOpen(val)}
            className="flex items-center justify-center flex-shrink0"
            buttonClassName="flex items-center justify-center bg-layer-2 hover:bg-layer-2-hover rounded-md"
            label={
              <span className="grid h-9 w-9 place-items-center rounded-md">
                <>
                  {formData?.logo_props?.in_use ? (
                    <Logo logo={formData?.logo_props} size={18} type="lucide" />
                  ) : (
                    <PageIcon className="h-4 w-4 text-tertiary" />
                  )}
                </>
              </span>
            }
            onChange={(val: any) => {
              let logoValue = {};

              if (val?.type === "emoji")
                logoValue = {
                  value: val.value,
                  url: undefined,
                };
              else if (val?.type === "icon") logoValue = val.value;

              handleFormData("logo_props", {
                in_use: val?.type,
                [val?.type]: logoValue,
              });
              setIsOpen(false);
            }}
            defaultIconColor={
              formData?.logo_props?.in_use && formData?.logo_props?.in_use === "icon"
                ? formData?.logo_props?.icon?.color
                : undefined
            }
            defaultOpen={
              formData?.logo_props?.in_use && formData?.logo_props?.in_use === "emoji"
                ? EmojiIconPickerTypes.EMOJI
                : EmojiIconPickerTypes.ICON
            }
          />
          <div className="space-y-1 flew-grow w-full">
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleFormData("name", e.target.value)}
              placeholder="Title"
              className="w-full resize-none text-14"
              tabIndex={getIndex("name")}
              required
              autoFocus
            />
            {isTitleLengthMoreThan255Character && (
              <span className="text-11 text-danger-primary">
                Max length of the name should be less than 255 characters
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="px-5 py-4 flex items-center justify-between gap-2 border-t-[0.5px] border-subtle">
        <div className="flex items-center gap-2">
          <AccessField
            onChange={(access) => handleFormData("access", access)}
            value={formData?.access ?? EPageAccess.PUBLIC}
            accessSpecifiers={PAGE_ACCESS_SPECIFIERS}
            isMobile={isMobile}
          />
          <h6 className="text-11 font-medium">{t(i18n_access_label || "")}</h6>
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" size="lg" onClick={handleModalClose} tabIndex={getIndex("cancel")}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="lg"
            type="submit"
            loading={isSubmitting}
            disabled={isTitleLengthMoreThan255Character}
            tabIndex={getIndex("submit")}
          >
            {isSubmitting ? "Creating" : "Create Page"}
          </Button>
        </div>
      </div>
    </form>
  );
}
