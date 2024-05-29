import { FormEvent, useState } from "react";
// types
import { FileText } from "lucide-react";
import { TPage } from "@plane/types";
// ui
import { Button, EmojiIconPicker, EmojiIconPickerTypes, Input, Tooltip } from "@plane/ui";
import { Logo } from "@/components/common";
// constants
import { PAGE_ACCESS_SPECIFIERS } from "@/constants/page";
// helpers
import { cn } from "@/helpers/common.helper";
import { convertHexEmojiToDecimal } from "@/helpers/emoji.helper";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";

type Props = {
  formData: Partial<TPage>;
  handleFormData: <T extends keyof TPage>(key: T, value: TPage[T]) => void;
  handleModalClose: () => void;
  handleFormSubmit: () => Promise<void>;
};

export const PageForm: React.FC<Props> = (props) => {
  const { formData, handleFormData, handleModalClose, handleFormSubmit } = props;
  // hooks
  const { isMobile } = usePlatformOS();
  // state
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        <h3 className="text-xl font-medium text-custom-text-200">Create Page</h3>
        <div className="flex items-start gap-2 h-9 w-full">
          <EmojiIconPicker
            isOpen={isOpen}
            handleToggle={(val: boolean) => setIsOpen(val)}
            className="flex items-center justify-center flex-shrink0"
            buttonClassName="flex items-center justify-center"
            label={
              <span className="grid h-9 w-9 place-items-center rounded-md bg-custom-background-90">
                <>
                  {formData?.logo_props?.in_use ? (
                    <Logo logo={formData?.logo_props} size={18} type="lucide" />
                  ) : (
                    <FileText className="h-4 w-4 text-custom-text-300" />
                  )}
                </>
              </span>
            }
            onChange={(val: any) => {
              let logoValue = {};

              if (val?.type === "emoji")
                logoValue = {
                  value: convertHexEmojiToDecimal(val.value.unified),
                  url: val.value.imageUrl,
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
              className="w-full resize-none text-base"
              tabIndex={1}
              required
              autoFocus
            />
            {isTitleLengthMoreThan255Character && (
              <span className="text-xs text-red-500">Max length of the name should be less than 255 characters</span>
            )}
          </div>
        </div>
      </div>
      <div className="px-5 py-4 flex items-center justify-between gap-2 border-t-[0.5px] border-custom-border-200">
        <div className="flex items-center gap-2">
          <div className="flex flex-shrink-0 items-stretch gap-0.5 rounded border-[0.5px] border-custom-border-200 p-1">
            {PAGE_ACCESS_SPECIFIERS.map((access, index) => (
              <Tooltip key={access.key} tooltipContent={access.label} isMobile={isMobile}>
                <button
                  type="button"
                  onClick={() => handleFormData("access", access.key)}
                  className={cn(
                    "flex-shrink-0 relative flex justify-center items-center w-6 h-6 rounded-sm p-1 transition-all",
                    formData.access === access.key ? "bg-custom-background-80" : "hover:bg-custom-background-80"
                  )}
                  tabIndex={2 + index}
                >
                  <access.icon
                    className={cn(
                      "h-3.5 w-3.5 transition-all",
                      formData.access === access.key ? "text-custom-text-100" : "text-custom-text-400"
                    )}
                    strokeWidth={2}
                  />
                </button>
              </Tooltip>
            ))}
          </div>
          <h6 className="text-xs font-medium">
            {PAGE_ACCESS_SPECIFIERS.find((access) => access.key === formData.access)?.label}
          </h6>
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button variant="neutral-primary" size="sm" onClick={handleModalClose} tabIndex={4}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            loading={isSubmitting}
            disabled={isTitleLengthMoreThan255Character}
            tabIndex={5}
          >
            {isSubmitting ? "Creating" : "Create Page"}
          </Button>
        </div>
      </div>
    </form>
  );
};
