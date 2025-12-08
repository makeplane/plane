"use client";
import React from "react";
import { Select, Spin, Tag } from "antd";
import { FolderOutlined } from "@ant-design/icons";
import { useParams } from "next/navigation";
import { CaseService } from "../../../../services/qa/case.service";
import { CaseService as ReviewApiService } from "../../../../services/qa/review.service";
import { formatCNDateTime } from "../util";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { getEnums } from "app/(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/test-management/util";

const enumsCache: Record<
  string,
  { case_test_type?: Record<string, string>; plan_case_result?: Record<string, string> }
> = {};
const enumsReqCache: Record<string, Promise<any>> = {};

type SideInfoPanelProps = {
  caseData: any;
  caseTestTypeMap?: Record<string, string>;
};

export function SideInfoPanel({ caseData, caseTestTypeMap }: SideInfoPanelProps) {
  const { workspaceSlug } = useParams() as { workspaceSlug?: string };
  const caseService = React.useMemo(() => new CaseService(), []);
  const reviewService = React.useMemo(() => new ReviewApiService(), []);

  const [enumsData, setEnumsData] = React.useState<{
    case_test_type?: Record<string, string>;
    plan_case_result?: Record<string, string>;
  }>({});
  const [loadingEnums, setLoadingEnums] = React.useState<boolean>(false);
  React.useEffect(() => {
    if (caseTestTypeMap && Object.keys(caseTestTypeMap).length > 0) {
      setEnumsData({ case_test_type: caseTestTypeMap });
      return;
    }
    if (!workspaceSlug) return;
    const key = String(workspaceSlug);
    if (enumsCache[key] && Object.keys(enumsCache[key]?.case_test_type || {}).length > 0) {
      setEnumsData(enumsCache[key]);
      return;
    }
    setLoadingEnums(true);
    const req = enumsReqCache[key] || getEnums(key);
    enumsReqCache[key] = req;
    req
      .then((enums) => {
        const data = { case_test_type: enums.case_test_type || {}, plan_case_result: enums.plan_case_result || {} };
        enumsCache[key] = data;
        setEnumsData(data);
      })
      .finally(() => setLoadingEnums(false));
  }, [workspaceSlug, caseTestTypeMap]);

  const [reviewEnums, setReviewEnums] = React.useState<
    Record<string, Record<string, { label: string; color: string }>>
  >({});
  React.useEffect(() => {
    if (!workspaceSlug) return;
    reviewService
      .getReviewEnums(String(workspaceSlug))
      .then((data) => setReviewEnums(data || {}))
      .catch(() => {});
  }, [workspaceSlug, reviewService]);

  const normalizeId = (v: any): string | undefined => {
    if (v === null || v === undefined) return undefined;
    if (typeof v === "object") {
      const id = (v as any).id ?? (v as any).value ?? (v as any).uuid;
      return id ? String(id) : undefined;
    }
    return String(v);
  };

  const [testTypeValue, setTestTypeValue] = React.useState<string | undefined>(undefined);
  const optionsReady = React.useMemo(
    () => Object.keys(enumsData.case_test_type || {}).length > 0,
    [enumsData.case_test_type]
  );
  const syncTimerRef = React.useRef<number | undefined>(undefined);
  React.useEffect(() => {
    if (!optionsReady) return;
    if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current);
    syncTimerRef.current = window.setTimeout(() => {
      setTestTypeValue(normalizeId(caseData?.test_type));
    }, 150);
    return () => {
      if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current);
    };
  }, [caseData?.test_type, optionsReady]);

  const colorForLabel = (text: string) => {
    if (text && text.includes("手动")) return "bg-blue-500";
    if (text && text.includes("自动")) return "bg-green-500";
    return "bg-gray-300";
  };

  const buildLabelNode = (text: string) => (
    <span className="inline-flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${colorForLabel(text)}`} />
      <span className="truncate">{text}</span>
    </span>
  );

  const caseTestTypeOptions = React.useMemo(
    () =>
      Object.entries(enumsData.case_test_type || {}).map(([value, text]) => ({
        value,
        label: buildLabelNode(String(text)),
      })),
    [enumsData.case_test_type]
  );

  const handleChangeTestType = async (v: string) => {
    setTestTypeValue(v);
    const id = String(caseData?.id || "");
    if (!id || !workspaceSlug) return;
    try {
      await caseService.updateCase(String(workspaceSlug), { id, test_type: Number(v) });
    } catch {}
  };

  type TExecRecord = {
    id?: string | number;
    name?: string;
    result?: string;
    created_by?: string | null;
    created_at?: string;
  };
  const [latestExec, setLatestExec] = React.useState<TExecRecord | null>(null);
  React.useEffect(() => {
    const id = String(caseData?.id || "");
    if (!workspaceSlug || !id) return;
    caseService
      .getCaseExecuteRecord(String(workspaceSlug), id)
      .then((res) => {
        const list: TExecRecord[] = Array.isArray((res as any)?.data)
          ? (res as any).data
          : Array.isArray(res)
            ? (res as any)
            : [];
        if (list.length === 0) {
          setLatestExec(null);
          return;
        }
        const sorted = [...list].sort(
          (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );
        setLatestExec(sorted[0]);
      })
      .catch(() => setLatestExec(null));
  }, [workspaceSlug, caseData?.id]);

  return (
    <div className="w-1/3 border-l px-6 py-4 h-full overflow-y-auto bg-[#FAFAFA] divide-y divide-gray-100">
      <div className="py-5">
        <div className="text-xs text-gray-500 mb-4">属性</div>
        <div className="space-y-4">
          <div className="flex items-center gap-3 md:gap-4">
            <span className="text-sm font-medium text-gray-700 shrink-0 basis-28 md:basis-32">测试类型</span>
            {optionsReady ? (
              <div
                className={
                  "flex-1 min-w-0 rounded-md border border-transparent transition-colors duration-200 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-100"
                }
              >
                <Select
                  className="w-full"
                  bordered={false}
                  suffixIcon={null}
                  options={caseTestTypeOptions}
                  value={testTypeValue}
                  onChange={handleChangeTestType}
                  placeholder="请选择测试类型"
                  aria-label="测试类型"
                />
              </div>
            ) : (
              <div className="flex-1 min-w-0 h-8 flex items-center">
                <Spin size="small" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="py-5">
        <div className="text-xs text-gray-500 mb-4">变更</div>
        <div className="space-y-4">
          <div className="flex items-center gap-3 md:gap-4">
            <span className="text-sm text-gray-700 shrink-0 basis-28 md:basis-32">版本</span>
            <span className="text-sm text-gray-900 flex-1 min-w-0 truncate">v1</span>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <span className="text-sm text-gray-700 shrink-0 basis-28 md:basis-32">评审状态</span>
            <span className="text-sm text-gray-900 flex-1 min-w-0 truncate">
              {(() => {
                const v = String(caseData?.review ?? "-");
                const color = (reviewEnums?.CaseReviewThrough_Result?.[v]?.color as any) || "default";
                return <Tag color={color}>{v || "-"}</Tag>;
              })()}
            </span>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <span className="text-sm text-gray-700 shrink-0 basis-28 md:basis-32">基线</span>
            <span className="text-sm text-gray-900 flex-1 min-w-0 truncate">-</span>
          </div>
        </div>
      </div>

      <div className="py-5">
        <div className="text-xs text-gray-500 mb-4">最近执行</div>
        <div className="space-y-4">
          <div className="flex items-center gap-3 md:gap-4">
            <span className="text-sm text-gray-700 shrink-0 basis-28 md:basis-32">计划</span>
            <span className="text-sm text-gray-900 flex-1 min-w-0 truncate">{latestExec?.name ?? "-"}</span>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <span className="text-sm text-gray-700 shrink-0 basis-28 md:basis-32">结果</span>
            <span className="text-sm text-gray-900 flex-1 min-w-0 truncate">
              {(() => {
                const label = latestExec?.result ?? "";
                const color = (enumsData?.plan_case_result || {})[label];
                return label ? <Tag color={color}>{label}</Tag> : "-";
              })()}
            </span>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <span className="text-sm text-gray-700 shrink-0 basis-28 md:basis-32">执行人</span>
            <span className="text-sm text-gray-900 flex-1 min-w-0 truncate">
              {latestExec?.created_by ? (
                <MemberDropdown
                  multiple={false}
                  value={latestExec?.created_by ?? null}
                  onChange={() => {}}
                  disabled={true}
                  placeholder="未知用户"
                  className="w-full text-sm"
                  buttonContainerClassName="w-full text-left p-0 cursor-default"
                  buttonVariant="transparent-with-text"
                  buttonClassName="text-sm p-0 hover:bg-transparent hover:bg-inherit"
                  showUserDetails={true}
                  optionsClassName="z-[60]"
                />
              ) : (
                "-"
              )}
            </span>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <span className="text-sm text-gray-700 shrink-0 basis-28 md:basis-32">时间</span>
            <span className="text-sm text-gray-900 flex-1 min-w-0 truncate">
              {latestExec?.created_at ? formatCNDateTime(latestExec.created_at) : "-"}
            </span>
          </div>
        </div>
      </div>

      <div className="py-5">
        <div className="text-xs text-gray-500 mb-4">工时</div>
        <div className="space-y-4">
          <div className="flex items-center gap-3 md:gap-4">
            <span className="text-sm text-gray-700 shrink-0 basis-28 md:basis-32">预估工时</span>
            <span className="text-sm text-gray-900 flex-1 min-w-0 truncate">-</span>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <span className="text-sm text-gray-700 shrink-0 basis-28 md:basis-32">登记工时</span>
            <span className="text-sm text-gray-900 flex-1 min-w-0 truncate">-</span>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <span className="text-sm text-gray-700 shrink-0 basis-28 md:basis-32">剩余工时</span>
            <span className="text-sm text-gray-900 flex-1 min-w-0 truncate">-</span>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <span className="text-sm text-gray-700 shrink-0 basis-28 md:basis-32">工时进度</span>
            <span className="text-sm text-gray-900 flex-1 min-w-0 truncate">-</span>
          </div>
        </div>
      </div>

      <div className="py-5">
        <div className="text-xs text-gray-500 mb-4">基础信息</div>
        <div className="space-y-4">
          <div className="flex items-center gap-3 md:gap-4">
            <span className="text-sm text-gray-700 shrink-0 basis-28 md:basis-32">测试库</span>
            <span className="text-sm text-gray-900 flex-1 min-w-0 truncate inline-flex items-center gap-2">
              <FolderOutlined className="text-blue-500" />
              <span className="truncate">{caseData?.repository?.name ?? "-"}</span>
            </span>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <span className="text-sm text-gray-700 shrink-0 basis-28 md:basis-32">创建人</span>
            <span className="text-sm text-gray-900 flex-1 min-w-0 truncate">
              {
                <MemberDropdown
                  multiple={false}
                  value={caseData?.created_by?.id ?? null}
                  onChange={(val) => {}}
                  disabled={true}
                  placeholder="请选择维护人"
                  className="w-full text-sm"
                  buttonContainerClassName="w-full text-left"
                  buttonVariant="transparent-with-text"
                  buttonClassName="text-sm"
                  showUserDetails={true}
                  optionsClassName="z-[60]"
                />
              }
            </span>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <span className="text-sm text-gray-700 shrink-0 basis-28 md:basis-32">创建时间</span>
            <span className="text-sm text-gray-900 flex-1 min-w-0 truncate">
              {formatCNDateTime(caseData?.created_at)}
            </span>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <span className="text-sm text-gray-700 shrink-0 basis-28 md:basis-32">更新人</span>
            <span className="text-sm text-gray-900 flex-1 min-w-0 truncate">
              {
                <MemberDropdown
                  multiple={false}
                  value={caseData?.updated_by?.id ?? null}
                  onChange={(val) => {}}
                  disabled={true}
                  placeholder="请选择维护人"
                  className="w-full text-sm"
                  buttonContainerClassName="w-full text-left"
                  buttonVariant="transparent-with-text"
                  buttonClassName="text-sm"
                  showUserDetails={true}
                  optionsClassName="z-[60]"
                />
              }
            </span>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <span className="text-sm text-gray-700 shrink-0 basis-28 md:basis-32">更新时间</span>
            <span className="text-sm text-gray-900 flex-1 min-w-0 truncate">
              {formatCNDateTime(caseData?.updated_at)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
