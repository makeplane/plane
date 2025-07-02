import { Rocket } from "lucide-react";
import { useTranslation } from "@plane/i18n";

interface IProgressProps {
  completedIssues: number;
  totalIssues: number;
}

const Progress = (props: IProgressProps) => {
  const { completedIssues, totalIssues } = props;
  const { t } = useTranslation();
  return (
    <div className="flex text-custom-text-300 text-xs gap-3 mb-3 items-center">
      <div className="flex font-medium mr-2 items-center">
        <Rocket size={16} className="my-auto mr-1" />
        <span>
          {t("updates.progress.title")}
          {"  "}
          {totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0}%
        </span>
      </div>
      <div>
        {completedIssues} / {totalIssues} done
      </div>
    </div>
  );
};

export default Progress;
