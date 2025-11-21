"use client";

import React from "react";
import { Spin, message } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { cn, renderFormattedDate } from "@plane/utils";
import { CaseService as ReviewApiService } from "@/services/qa/review.service";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
import { useMember } from "@/hooks/store/use-member";

type ReviewRecord = {
  id: string;
  result: string;
  reason?: string | null;
  assignee?: string | null;
  created_at?: string;
};

type Props = {
  workspaceSlug: string | undefined;
  reviewId: string | undefined;
  caseId: string | undefined;
  className?: string;
};

export const ReviewRecordsPanel: React.FC<Props> = (props) => {
  const { workspaceSlug, reviewId, caseId, className = "" } = props;
  const reviewService = React.useMemo(() => new ReviewApiService(), []);
  const { getUserDetails } = useMember();

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [records, setRecords] = React.useState<ReviewRecord[]>([]);

  const fetchRecords = async () => {
    if (!workspaceSlug || !reviewId || !caseId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await reviewService.getRecords(String(workspaceSlug), String(reviewId), String(caseId));
      setRecords(Array.isArray(data) ? (data as ReviewRecord[]) : []);
    } catch (e: any) {
      const msg = e?.message || e?.detail || e?.error || "获取评审记录失败";
      setError(msg);
      message.error(msg);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchRecords();
  }, [workspaceSlug, reviewId, caseId]);

  const renderResult = (result: string) => {
    const val = String(result || "");
    if (val === "通过")
      return (
        <span className="flex items-center gap-1 text-sm" style={{ color: "#52c41a" }}>
          <CheckCircleOutlined /> 通过
        </span>
      );
    if (val === "不通过")
      return (
        <span className="flex items-center gap-1 text-sm" style={{ color: "#f5222d" }}>
          <CloseCircleOutlined /> 不通过
        </span>
      );
    if (val === "建议")
      return (
        <span className="flex items-center gap-1 text-sm" style={{ color: "#fa8c16" }}>
          <ExclamationCircleOutlined /> 建议
        </span>
      );
    if (val === "重新提审")
      return (
        <span className="flex items-center gap-1 text-sm" style={{ color: "#faad14" }}>
          <ExclamationCircleOutlined /> 重新提审
        </span>
      );
    return <span className="text-sm text-custom-text-300">-</span>;
  };

  return (
    <div
      className={cn(
        "p-4 text-sm text-custom-text-300",
        "h-[550px] overflow-y-auto vertical-scrollbar scrollbar-sm scroll-smooth",
        className
      )}
    >
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Spin />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-800">{error}</div>
      ) : records.length === 0 ? (
        <div className="text-custom-text-300">暂无评审记录</div>
      ) : (
        <div className="flex flex-col gap-4">
          {records.map((r) => {
            const uid = r.assignee ? String(r.assignee) : null;
            const user = uid ? getUserDetails(uid) : undefined;
            const name = user?.display_name || "未知用户";
            const time = r.created_at ? renderFormattedDate(r.created_at, "YYYY-MM-DD HH:mm:ss") : "";
            return (
              <div
                key={String(r.id)}
                className="flex items-start justify-between gap-4 rounded-md bg-custom-background-100 p-4 shadow-sm"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="flex-shrink-0">
                    <MemberDropdown
                      buttonVariant="transparent-with-text"
                      multiple={false}
                      value={uid}
                      onChange={() => {}}
                      disabled
                      placeholder={name}
                      className="text-sm"
                      buttonContainerClassName="p-0 cursor-default"
                      buttonClassName="p-0 hover:bg-transparent hover:bg-inherit"
                      showUserDetails
                      optionsClassName="z-[60]"
                      button={<ButtonAvatars showTooltip={false} userIds={uid} size="lg" />}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{name}</div>
                    {r.reason ? (
                      <div className="text-sm text-custom-text-300 whitespace-pre-wrap break-words">
                        {String(r.reason)}
                      </div>
                    ) : null}
                    <div className="text-xs text-custom-text-400 mt-2">{time}</div>
                  </div>
                </div>
                <div className="flex-shrink-0">{renderResult(r.result)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
