import { PlusIcon } from "lucide-react";
import { useTranslation } from "@plane/i18n";

type TProps = {
  onClick: () => void;
};
export const AddLink = (props: TProps) => {
  const { onClick } = props;
  const { t } = useTranslation();

  return (
    <button
      className="btn btn-primary flex bg-custom-background-100 px-4 w-[230px] h-[56px] border-[0.5px] border-custom-border-200 rounded-md gap-4"
      onClick={onClick}
    >
      <div className="rounded p-2 bg-custom-background-80/40 w-8 h-8 my-auto">
        <PlusIcon className="h-4 w-4 stroke-2 text-custom-text-350" />
      </div>
      <div className="text-sm font-medium my-auto">{t("home.quick_links.add")}</div>
    </button>
  );
};
