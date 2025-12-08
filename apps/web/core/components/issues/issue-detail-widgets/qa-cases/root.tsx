"use client";

import type { FC } from "react";
import React from "react";
import { observer } from "mobx-react";
import type { TIssueServiceType } from "@plane/types";
import { Collapsible } from "@plane/ui";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { QaCasesCollapsibleTitle } from "./title";
import { CaseService } from "@/services/qa/case.service";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { QaCasesCollapsibleContent } from "./content";

type Props = {
  workspaceSlug: string;
  issueId: string;
  disabled?: boolean;
  issueServiceType: TIssueServiceType;
};

export const QaCasesCollapsible: FC<Props> = observer((props) => {
  const { workspaceSlug, issueId, disabled = false, issueServiceType } = props;
  const { openWidgets, toggleOpenWidget } = useIssueDetail(issueServiceType);
  const isCollapsibleOpen = openWidgets.includes("qa-cases");
  const [refreshKey, setRefreshKey] = React.useState(0);
  const serviceRef = React.useRef(new CaseService());
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<any[]>([]);

  const fetchData = React.useCallback(async () => {
    if (!workspaceSlug || !issueId) return;
    setLoading(true);
    try {
      const list = await serviceRef.current.getIssueCase(String(workspaceSlug), String(issueId));
      if (!Array.isArray(list)) {
        setToast({ type: TOAST_TYPE.ERROR, title: "数据格式错误", message: "用例列表应为数组" });
        setData([]);
      } else {
        setData(list as any[]);
      }
    } catch (e: any) {
      const message = e?.detail || e?.error || e?.message || "网络或服务错误";
      setToast({ type: TOAST_TYPE.ERROR, title: "获取用例失败", message });
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [workspaceSlug, issueId]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  const handleDelete = React.useCallback(
    async (caseId: string | number) => {
      if (!workspaceSlug || !issueId || !caseId) return;
      try {
        await serviceRef.current.deleteIssueCase(String(workspaceSlug), String(issueId), String(caseId));
        setToast({ type: TOAST_TYPE.SUCCESS, title: "已解除关联", message: "该用例已从当前问题移除" });
        setRefreshKey((k) => k + 1);
      } catch (e: any) {
        const message = e?.detail || e?.error || e?.message || "操作失败";
        setToast({ type: TOAST_TYPE.ERROR, title: "解除关联失败", message });
      }
    },
    [workspaceSlug, issueId]
  );

  const count = data.length;

  if (!loading && count === 0) return null;

  return (
    <Collapsible
      isOpen={isCollapsibleOpen}
      onToggle={() => toggleOpenWidget("qa-cases")}
      title={
        <QaCasesCollapsibleTitle
          isOpen={isCollapsibleOpen}
          disabled={disabled}
          onRefresh={() => setRefreshKey((k) => k + 1)}
          count={count}
        />
      }
      buttonClassName="w-full"
    >
      <QaCasesCollapsibleContent data={data} loading={loading} workspaceSlug={workspaceSlug} onDelete={handleDelete} />
    </Collapsible>
  );
});
