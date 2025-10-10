"use client";

import { useEffect } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { ContrastIcon } from "@plane/propel/icons";
import { cn } from "@plane/utils";
// hooks
import { useCycle } from "@/hooks/store/use-cycle";

export type TReadonlyCycleProps = {
  className?: string;
  hideIcon?: boolean;
  value: string | null;
  placeholder?: string;
  projectId: string | undefined;
  workspaceSlug: string;
};

export const ReadonlyCycle: React.FC<TReadonlyCycleProps> = observer((props) => {
  const { className, hideIcon = false, value, placeholder, projectId, workspaceSlug } = props;

  const { t } = useTranslation();
  const { getCycleNameById, fetchAllCycles } = useCycle();
  const cycleName = value ? getCycleNameById(value) : null;

  useEffect(() => {
    if (projectId) {
      fetchAllCycles(workspaceSlug, projectId);
    }
  }, [projectId, workspaceSlug]);

  return (
    <div className={cn("flex items-center gap-1 text-sm", className)}>
      {!hideIcon && <ContrastIcon className="size-4 flex-shrink-0" />}
      <span className="flex-grow truncate">{cycleName ?? placeholder ?? t("common.none")}</span>
    </div>
  );
});
