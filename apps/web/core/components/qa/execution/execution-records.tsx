"use client";

import React from "react";
import { Spin, message, Tag, Modal, Table, Tooltip } from "antd";
import * as LucideIcons from "lucide-react";
import { cn, renderFormattedDate } from "@plane/utils";
import { PlanService as PlanApiService } from "@/services/qa/plan.service";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
import { useMember } from "@/hooks/store/use-member";
import { useSearchParams } from "next/navigation";
import { getEnums } from "app/(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/test-management/util";

type ExecRecord = {
  id: string;
  result: string;
  reason?: string | null;
  assignee?: string | null;
  created_at?: string;
  steps?: StepItem[] | null;
};

type StepItem = {
  description?: string;
  result?: string;
  actual_result?: string;
  exec_result?: string;
};

type Props = {
  workspaceSlug: string | undefined;
  reviewId: string | undefined;
  caseId: string | undefined;
  className?: string;
};

export const ExecutionRecordsPanel: React.FC<Props> = (props) => {
  const { workspaceSlug, reviewId, caseId, className = "" } = props;
  const planService = React.useMemo(() => new PlanApiService(), []);
  const { getUserDetails } = useMember();
  const searchParams = useSearchParams();
  const planId = searchParams.get("plan_id") ?? searchParams.get("planId") ?? "";

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [records, setRecords] = React.useState<ExecRecord[]>([]);
  const [resultColorMap, setResultColorMap] = React.useState<Record<string, string>>({});

  const [stepsModalOpen, setStepsModalOpen] = React.useState(false);
  const [stepsModalSteps, setStepsModalSteps] = React.useState<StepItem[]>([]);

  const normalizeSteps = React.useCallback((steps: any): StepItem[] => {
    if (!Array.isArray(steps)) return [];
    return steps.map((s) => ({
      description: String(s?.description ?? s?.desc ?? ""),
      result: String(s?.result ?? s?.expected_result ?? ""),
      actual_result: String(s?.actual_result ?? ""),
      exec_result: String(s?.exec_result ?? ""),
    }));
  }, []);

  const openStepsModal = React.useCallback(
    (rec: ExecRecord) => {
      try {
        const steps = normalizeSteps(rec?.steps ?? []);
        setStepsModalSteps(steps);
        setStepsModalOpen(true);
      } catch (e: any) {
        const msg = e?.message || "加载步骤详情失败";
        message.error(msg);
      }
    },
    [normalizeSteps]
  );

  const StepsDetailTable: React.FC<{ steps?: StepItem[] }> = ({ steps }) => {
    if (!Array.isArray(steps) || steps.length === 0) {
      return <span className="text-custom-text-300">暂无内容</span>;
    }
    const headerStyle = { backgroundColor: "#f5f5f5", padding: 12, border: "1px solid #e8e8e8" } as const;
    const cellStyle = { padding: 12, border: "1px solid #e8e8e8" } as const;
    const columns = [
      {
        title: "序号",
        key: "index",
        width: 80,
        render: (_: any, __: StepItem, idx: number) => idx + 1,
        onHeaderCell: () => ({ style: headerStyle }),
        onCell: () => ({ style: cellStyle }),
      },
      {
        title: "步骤描述",
        dataIndex: "description",
        key: "description",
        render: (text: any) => <span className="whitespace-pre-wrap break-words">{String(text || "")}</span>,
        onHeaderCell: () => ({ style: headerStyle }),
        onCell: () => ({ style: cellStyle }),
      },
      {
        title: "预期结果",
        dataIndex: "result",
        key: "result",
        render: (text: any) => (
          <span className="whitespace-pre-wrap break-words text-custom-text-300">{String(text || "")}</span>
        ),
        onHeaderCell: () => ({ style: headerStyle }),
        onCell: () => ({ style: cellStyle }),
      },
      {
        title: "实际结果",
        dataIndex: "actual_result",
        key: "actual_result",
        render: (text: any) => <span className="whitespace-pre-wrap break-words">{String(text || "-")}</span>,
        onHeaderCell: () => ({ style: headerStyle }),
        onCell: () => ({ style: cellStyle }),
      },
      {
        title: "步骤执行结果",
        dataIndex: "exec_result",
        key: "exec_result",
        render: (text: any) => {
          const val = String(text || "");
          const color = resultColorMap[val] || undefined;
          return <Tag color={color}>{val || "-"}</Tag>;
        },
        onHeaderCell: () => ({ style: headerStyle }),
        onCell: () => ({ style: cellStyle }),
      },
    ];
    return (
      <div className="rounded border border-custom-border-200">
        <div className="overflow-x-auto">
          <Table
            size="small"
            pagination={false}
            bordered={false}
            rowKey={(_: any, idx?: number) => String(idx ?? 0)}
            dataSource={steps}
            columns={columns as any}
          />
        </div>
      </div>
    );
  };

  const fetchEnums = async () => {
    if (!workspaceSlug) return;
    try {
      const enums = await getEnums(String(workspaceSlug));
      const map = enums?.plan_case_result || {};
      setResultColorMap(map);
    } catch {}
  };

  const fetchRecords = async () => {
    if (!workspaceSlug || !caseId || !planId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await planService.getPlanCaseRecord(String(workspaceSlug), {
        plan_id: String(planId),
        case_id: String(caseId),
      });
      const list = Array.isArray(data) ? (data as ExecRecord[]) : [];
      setRecords(list);
    } catch (e: any) {
      const msg = e?.message || e?.detail || e?.error || "获取执行记录失败";
      setError(msg);
      message.error(msg);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchEnums();
  }, [workspaceSlug]);

  React.useEffect(() => {
    fetchRecords();
  }, [workspaceSlug, reviewId, caseId, planId]);

  const renderResult = (result: string) => {
    const val = String(result || "");
    const color = resultColorMap[val] || undefined;
    return <Tag color={color}>{val || "-"}</Tag>;
  };

  return (
    <>
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
          <div className="text-custom-text-300">暂无执行记录</div>
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
                  <div className="flex-shrink-0">
                    <div className="flex items-center gap-2">
                      {renderResult(r.result)}
                      <Tooltip title="步骤详情" mouseEnterDelay={0.2} placement="top">
                        <button
                          type="button"
                          aria-label="查看步骤详情"
                          aria-haspopup="dialog"
                          onClick={() => openStepsModal(r)}
                          className="p-1 rounded hover:bg-custom-background-80 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-500 hover:text-blue-600"
                        >
                          <LucideIcons.ListOrdered size={16} aria-hidden="true" />
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Modal
        title="步骤详情"
        open={stepsModalOpen}
        onCancel={() => setStepsModalOpen(false)}
        footer={null}
        width={800}
        style={{ maxWidth: "95vw" }}
        destroyOnClose
      >
        <StepsDetailTable steps={stepsModalSteps} />
      </Modal>
    </>
  );
};
