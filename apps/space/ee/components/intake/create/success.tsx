import Image from "next/image";
import { useTheme } from "next-themes";
import SuccessDark from "@/public/instance/intake-sent-dark.png";
import SuccessLight from "@/public/instance/intake-sent-light.png";
import { Button, getButtonStyling } from "@plane/ui";
import Link from "next/link";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";

const FormSuccess = ({ onReset }: { onReset: () => void }) => {
  const { resolvedTheme } = useTheme();
  const { t } = useTranslation();
  return (
    <div className="flex flex-col m-auto justify-center space-y-4">
      <Image
        src={resolvedTheme?.includes("dark") ? SuccessDark : SuccessLight}
        alt="Success"
        height={205}
        width={205}
        className="mx-auto"
      />

      <span className="font-medium text-center text-2xl">{t("intake_forms.success.title")}</span>
      <span className="text-base text-custom-text-300 max-w-[360px] text-center mx-auto">
        {t("intake_forms.success.description")}
      </span>
      <div className="flex justify-center gap-2">
        <Button variant="primary" size="md" onClick={onReset}>
          {t("intake_forms.success.primary_button.text")}
        </Button>
        <Link href="https://plane.so/intake" target="_blank" className={cn(getButtonStyling("neutral-primary", "md"))}>
          {t("intake_forms.success.secondary_button.text")}
        </Link>
      </div>
    </div>
  );
};
export default FormSuccess;
