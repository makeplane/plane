import Image from "next/image";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/ui";
import ImagelLight from "@/public/empty-state/empty-updates-light.png";

type TProps = {
  handleNewUpdate: () => void;
  allowNew: boolean;
};

export const EmptyUpdates = (props: TProps) => {
  const { handleNewUpdate, allowNew } = props;
  const { t } = useTranslation();

  return (
    <div className="flex h-full">
      <div className="m-auto mt-[50%]">
        <Image src={ImagelLight} alt="No updates" className="w-[161px] m-auto" />
        <div className="w-fit m-auto text-lg font-medium items-center">{t("updates.empty.title")}</div>
        <div className="w-fit m-auto font-medium text-base text-custom-text-350">{t("updates.empty.description")}</div>
        {allowNew && (
          <Button className="mt-4 mx-auto" onClick={() => handleNewUpdate()}>
            {t("updates.add_update")}
          </Button>
        )}
      </div>
    </div>
  );
};
