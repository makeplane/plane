"use client";

import React from "react";
import { Transition } from "@headlessui/react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { PageHead } from "@/components/core/page-title";
import { Breadcrumbs } from "@plane/ui";
import { Row, Col, Card, Input, Pagination, Tag, Spin, message, Button, Table, Tooltip, Radio, Select } from "antd";
import * as LucideIcons from "lucide-react";
import debounce from "lodash-es/debounce";
import { CaseService as CaseApiService } from "@/services/qa/case.service";
import { PlanService as PlanApiService } from "@/services/qa/plan.service";
import { getEnums } from "app/(all)/[workspaceSlug]/(projects)/test-management/util";
import { RichTextEditor } from "../cases/util";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { useMember } from "@/hooks/store/use-member";
import { useUser } from "@/hooks/store/user";
import { WorkItemDisplayModal } from "../cases/work-item-display-modal";
import { ReviewRecordsPanel } from "../review/review-records";
import { CreateUpdateIssueModal } from "@/components/issues/issue-modal/modal";
import { BugIssueModal } from "@/components/issues/issue-modal/bug-modal";
import { ExecutionRecordsPanel } from "./execution-records";

type ReviewCaseRow = {
  id: string | number;
  case_id: string | number;
  name: string;
  priority: number;
  assignees: Array<string>;
  result: string;
  created_by: string | number | null;
};
type PlanCaseRow = {
  id: string | number;
  case: string | number;
  name: string;
  priority: number;
  assignees: Array<string>;
  result: string;
  created_by: string | number | null;
};

const BreadcrumbBack: React.FC<{ label: string; steps?: number }> = ({ label, steps = 1 }) => {
  const router = useRouter();
  const handleClick = React.useCallback(() => {
    if (steps <= 1) {
      router.back();
      return;
    }
    router.back();
    setTimeout(() => router.back(), 0);
  }, [router, steps]);
  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex items-center gap-1 text-custom-text-300 hover:text-custom-text-100"
    >
      {label}
    </button>
  );
};

export default function TestExecutionPage() {
  const { workspaceSlug } = useParams() as { workspaceSlug?: string };
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCaseId = searchParams.get("case_id") ?? undefined;
  const planId = searchParams.get("plan_id") ?? searchParams.get("planId") ?? "";
  const reviewId = searchParams.get("review_id") ?? "";

  const caseService = React.useMemo(() => new CaseApiService(), []);
  const planService = React.useMemo(() => new PlanApiService(), []);
  const {
    getUserDetails,
    workspace: { fetchWorkspaceMembers },
  } = useMember();
  const { data: currentUser } = useUser();

  const [listLoading, setListLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [cases, setCases] = React.useState<PlanCaseRow[]>([]);
  const [total, setTotal] = React.useState<number>(0);
  const [page, setPage] = React.useState<number>(1);
  const [pageSize, setPageSize] = React.useState<number>(10);
  const [keyword, setKeyword] = React.useState<string>("");
  const [selectedCaseId, setSelectedCaseId] = React.useState<string | undefined>(initialCaseId ?? undefined);

  const [detailLoading, setDetailLoading] = React.useState<boolean>(false);
  const [caseDetail, setCaseDetail] = React.useState<any>(null);
  const [enumsData, setEnumsData] = React.useState<{
    case_type?: Record<string, string>;
    case_priority?: Record<string, string>;
    case_state?: Record<string, string>;
    plan_case_result?: Record<string, string>;
  }>({});
  const [attachments, setAttachments] = React.useState<any[]>([]);
  const [activeTab, setActiveTab] = React.useState<"basic" | "requirement" | "work" | "defect" | "history">("basic");
  const [currentCount, setCurrentCount] = React.useState<number>(0);
  const [reviewValue, setReviewValue] = React.useState<string | null>(null);
  const [reason, setReason] = React.useState<string>("");
  const [submitLoading, setSubmitLoading] = React.useState<boolean>(false);
  const [recordsRefreshKey, setRecordsRefreshKey] = React.useState<number>(0);
  const [isCurrentUserReviewer, setIsCurrentUserReviewer] = React.useState<boolean>(false);
  const [stepActualResultMap, setStepActualResultMap] = React.useState<Record<number, string>>({});
  const [stepExecResultMap, setStepExecResultMap] = React.useState<Record<number, string>>({});
  const [isCreateDefectOpen, setIsCreateDefectOpen] = React.useState<boolean>(false);

  const [mounted, setMounted] = React.useState(false);
  const leftRef = React.useRef<HTMLDivElement | null>(null);
  const rightRef = React.useRef<HTMLDivElement | null>(null);
  const syncingRef = React.useRef<boolean>(false);

  const fetchCases = async (p = page, s = pageSize, kw?: string) => {
    if (!workspaceSlug) return;
    try {
      setListLoading(true);
      setError(null);
      const input = (kw ?? keyword).trim();
      const res = await planService.getPlanCaseList(String(workspaceSlug), String(planId), {
        page: p,
        page_size: s,
        ...(input ? { name__icontains: input } : {}),
      });
      setCases(Array.isArray(res?.data) ? (res.data as PlanCaseRow[]) : []);
      setTotal(Number(res?.count || 0));
      setPage(p);
      setPageSize(s);
    } catch (e: any) {
      const msg = e?.message || e?.detail || e?.error || "获取用例列表失败";
      setError(msg);
      message.error(msg);
    } finally {
      setListLoading(false);
    }
  };

  const fetchEnums = async () => {
    if (!workspaceSlug) return;
    try {
      const enums = await getEnums(String(workspaceSlug));
      setEnumsData({
        case_type: enums.case_type || {},
        case_priority: enums.case_priority || {},
        case_state: enums.case_state || {},
        plan_case_result: enums.plan_case_result || {},
      });
    } catch {}
  };

  const fetchCaseDetail = async (id?: string) => {
    const targetId = id ?? selectedCaseId;
    if (!workspaceSlug || !targetId) return;
    try {
      setDetailLoading(true);
      let data: any = null;
      try {
        if (planId) {
          data = await planService.getPlanCaseDetail(String(workspaceSlug), {
            plan_id: String(planId),
            case_id: String(targetId),
          });
        } else {
          data = await caseService.getCase(String(workspaceSlug), String(targetId));
        }
      } catch (err) {
        data = await caseService.getCase(String(workspaceSlug), String(targetId));
      }
      setCaseDetail(data);
      try {
        const list = await caseService.getCaseAssetList(String(workspaceSlug), String(targetId));
        setAttachments(Array.isArray(list) ? list : []);
      } catch {
        setAttachments([]);
      }
      try {
        const stepsData =
          Array.isArray((data as any)?.execute_steps) && (data as any).execute_steps.length > 0
            ? ((data as any).execute_steps as any[])
            : Array.isArray((data as any)?.steps)
              ? ((data as any).steps as any[])
              : [];
        const initialActualMap: Record<number, string> = {};
        const initialExecMap: Record<number, string> = {};
        stepsData.forEach((s: any, idx: number) => {
          if (s && s.actual_result !== undefined && s.actual_result !== null) {
            initialActualMap[idx] = String(s.actual_result);
          }
          if (s && s.exec_result !== undefined && s.exec_result !== null) {
            initialExecMap[idx] = String(s.exec_result);
          }
        });
        setStepActualResultMap(initialActualMap);
        setStepExecResultMap(initialExecMap);
      } catch {}
    } catch (e: any) {
      const msg = e?.message || e?.detail || e?.error || "获取用例详情失败";
      message.error(msg);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDownloadAttachment = async (attachment: any) => {
    const aid = String(attachment?.id ?? "");
    if (!workspaceSlug || !selectedCaseId || !aid) return;
    try {
      const resp = await caseService.getCaseAsset(String(workspaceSlug), String(selectedCaseId), aid);
      const blob = resp?.data as Blob;
      const filename = String(attachment?.attributes?.name ?? "附件");
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {}
  };

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    fetchCases(1, pageSize);
    fetchEnums();
    if (workspaceSlug) {
      try {
        fetchWorkspaceMembers(String(workspaceSlug));
      } catch (e: any) {
        const msg = e?.message || e?.detail || e?.error || "获取成员信息失败";
        message.error(msg);
      }
    }
  }, [workspaceSlug, planId]);

  React.useEffect(() => {
    if (initialCaseId) fetchCaseDetail(initialCaseId);
  }, [initialCaseId]);

  const debouncedSearch = React.useMemo(
    () =>
      debounce((v: string) => {
        fetchCases(1, pageSize, v);
      }, 300),
    [pageSize, workspaceSlug, planId]
  );
  const handleChangeActual = React.useCallback(
    (idx: number, val: string) => setStepActualResultMap((prev) => ({ ...prev, [idx]: val })),
    []
  );
  const handleChangeExec = React.useCallback(
    (idx: number, val: string) => setStepExecResultMap((prev) => ({ ...prev, [idx]: val })),
    []
  );

  React.useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  React.useEffect(() => {
    const map: Record<string, "Requirement" | "Task" | "Bug"> = {
      requirement: "Requirement",
      work: "Task",
      defect: "Bug",
    };
    const typeName = map[activeTab];
    if (!typeName || !workspaceSlug || !selectedCaseId) {
      setCurrentCount(0);
      return;
    }
    caseService
      .getCaseIssueWithType(String(workspaceSlug), { id: String(selectedCaseId), issues__type__name: typeName })
      .then((data) => {
        let resolved: any[] = [];
        if (Array.isArray(data)) {
          const item = data.find((d: any) => String(d?.id) === String(selectedCaseId));
          resolved = Array.isArray(item?.issues) ? (item.issues as any[]) : [];
        } else if (data && typeof data === "object") {
          resolved = Array.isArray((data as any).issues) ? ((data as any).issues as any[]) : [];
        }
        setCurrentCount(resolved.length);
      })
      .catch(() => setCurrentCount(0));
  }, [activeTab, workspaceSlug, selectedCaseId]);

  const handleRadioChange = (e: any) => {
    const val = String(e?.target?.value || "");
    setReviewValue(val);
  };

  React.useEffect(() => {
    const row = cases.find((item) => String(item.case) === String(selectedCaseId || ""));
    const reviewers = Array.isArray(row?.assignees) ? row!.assignees.map((id) => String(id)) : [];
    const isReviewer = currentUser?.id ? reviewers.includes(String(currentUser.id)) : false;
    setIsCurrentUserReviewer(isReviewer);
  }, [cases, selectedCaseId, currentUser?.id]);

  React.useEffect(() => {
    if (!selectedCaseId) return;
    const row = cases.find((item) => String(item.case) === String(selectedCaseId || ""));
    const reviewers = Array.isArray(row?.assignees) ? row!.assignees.map((id) => String(id)) : [];
    const isReviewer = currentUser?.id ? reviewers.includes(String(currentUser.id)) : false;
    const map = enumsData?.plan_case_result || {};
    const keys = Object.keys(map).filter((k) => k !== "未执行");
    let def: string | null = null;
    if (isReviewer && keys.includes("通过")) def = "通过";
    else if (!isReviewer && keys.includes("建议")) def = "建议";
    else def = keys[0] ?? null;
    setReviewValue(def);
    setReason("");
  }, [selectedCaseId, cases, currentUser?.id, enumsData?.plan_case_result]);

  const buildPayload = () => {
    if (!workspaceSlug || !planId || !selectedCaseId || !reviewValue || !currentUser?.id) return null;
    const chosenSteps =
      Array.isArray((caseDetail as any)?.execute_steps) && (caseDetail as any).execute_steps.length > 0
        ? ((caseDetail as any).execute_steps as any[])
        : Array.isArray((caseDetail as any)?.steps)
          ? ((caseDetail as any).steps as any[])
          : [];
    const stepsPayload = (chosenSteps || []).map((s: any, idx: number) => ({
      description: String(s?.description ?? ""),
      result: String(s?.result ?? ""),
      actual_result: String(stepActualResultMap[idx] || ""),
      exec_result: String(stepExecResultMap[idx] || ""),
    }));
    const payload: any = {
      plan_id: String(planId),
      case_id: String(selectedCaseId),
      result: String(reviewValue),
      steps: stepsPayload,
      assignee: String(currentUser.id),
      issue_ids: [],
    };
    if (reason && reason.trim()) payload.reason = reason.trim();
    return payload;
  };

  const debouncedSubmit = React.useMemo(
    () =>
      debounce(async (payload: any) => {
        if (!payload) return;
        setSubmitLoading(true);
        try {
          await planService.caseExecute(String(workspaceSlug), payload);
          message.success("执行结果提交成功");
          setReason("");
          setStepActualResultMap({});
          setStepExecResultMap({});
          await fetchCases(page, pageSize, keyword);
          await fetchCaseDetail(String(selectedCaseId));
        } catch (e: any) {
          const msg = e?.message || e?.detail || e?.error || "提交结果失败";
          message.error(msg);
        } finally {
          setSubmitLoading(false);
        }
      }, 500),
    [workspaceSlug, page, pageSize, keyword, selectedCaseId]
  );

  React.useEffect(() => {
    return () => {
      debouncedSubmit.cancel();
    };
  }, [debouncedSubmit]);

  const handleSubmitReview = () => {
    const payload = buildPayload();
    if (!payload) {
      message.warning("缺少必要参数或用户信息，无法提交");
      return;
    }
    debouncedSubmit(payload);
  };

  const handleOpenCreateDefect = () => {
    if (!workspaceSlug) {
      message.warning("缺少工作空间信息，无法创建缺陷");
      return;
    }
    setIsCreateDefectOpen(true);
  };

  const onSyncScroll = (source: "left" | "right") => {
    if (syncingRef.current) return;
    const left = leftRef.current;
    const right = rightRef.current;
    if (!left || !right) return;
    syncingRef.current = true;
    const s = source === "left" ? left : right;
    const t = source === "left" ? right : left;
    const ratio = s.scrollTop / Math.max(1, s.scrollHeight - s.clientHeight);
    t.scrollTop = ratio * Math.max(1, t.scrollHeight - t.clientHeight);
    syncingRef.current = false;
  };

  type StepItem = { result: string; description: string; exec_result?: string; actual_result?: string; __key: string };
  const displaySteps = React.useMemo((): StepItem[] => {
    const execSteps = Array.isArray((caseDetail as any)?.execute_steps)
      ? ((caseDetail as any).execute_steps as any[])
      : null;
    const baseSteps = Array.isArray((caseDetail as any)?.steps) ? ((caseDetail as any).steps as any[]) : [];
    const chosen = execSteps && execSteps.length > 0 ? execSteps : baseSteps;
    return (chosen || []).map((s: any, i: number) => ({
      description: String(s?.description ?? ""),
      result: String(s?.result ?? ""),
      exec_result: String(s?.exec_result ?? ""),
      actual_result: String(s?.actual_result ?? ""),
      __key: `${String(s?.id ?? "")}-${String(s?.description ?? "")}-${i}`,
    }));
  }, [caseDetail]);
  const buildStepsHtml = React.useCallback((): string => {
    const steps = displaySteps;
    if (!steps || steps.length === 0) return "<p></p>";
    const escape = (s: string) =>
      s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    const header =
      '<tr style="">' +
      '<td colspan="1" rowspan="1" colwidth="120" hidecontent="false" class="" style=""><p class="editor-paragraph-block">序号</p></td>' +
      '<td colspan="1" rowspan="1" colwidth="240" hidecontent="false" class="" style=""><p class="editor-paragraph-block">步骤描述</p></td>' +
      '<td colspan="1" rowspan="1" colwidth="200" hidecontent="false" class="" style=""><p class="editor-paragraph-block">预期结果</p></td>' +
      '<td colspan="1" rowspan="1" colwidth="200" hidecontent="false" class="" style=""><p class="editor-paragraph-block">实际结果</p></td>' +
      '<td colspan="1" rowspan="1" colwidth="180" hidecontent="false" class="" style=""><p class="editor-paragraph-block">步骤执行结果</p></td>' +
      "</tr>";
    const rows = steps
      .map((s, i) => {
        const idx = String(i + 1);
        const desc = escape(String(s.description || ""));
        const expected = escape(String((s as any).expected_result || s.result || ""));
        const actual = escape(String((s as any).actual_result || ""));
        const exec = escape(String((s as any).exec_result || ""));
        return (
          '<tr style="">' +
          '<td colspan="1" rowspan="1" colwidth="120" hidecontent="false" class="" style=""><p class="editor-paragraph-block">' +
          idx +
          "</p></td>" +
          '<td colspan="1" rowspan="1" colwidth="240" hidecontent="false" class="" style=""><p class="editor-paragraph-block">' +
          desc +
          "</p></td>" +
          '<td colspan="1" rowspan="1" colwidth="200" hidecontent="false" class="" style=""><p class="editor-paragraph-block">' +
          expected +
          "</p></td>" +
          '<td colspan="1" rowspan="1" colwidth="200" hidecontent="false" class="" style=""><p class="editor-paragraph-block">' +
          actual +
          "</p></td>" +
          '<td colspan="1" rowspan="1" colwidth="180" hidecontent="false" class="" style=""><p class="editor-paragraph-block">' +
          exec +
          "</p></td>" +
          "</tr>"
        );
      })
      .join("");
    return "<table><thead>" + header + "</thead><tbody>" + "<p></p>" + rows + "</tbody></table><p></p><p></p>";
  }, [displaySteps]);

  const StepsTableBase: React.FC<{
    steps?: StepItem[];
    actualMap: Record<number, string>;
    execMap: Record<number, string>;
    onChangeActual: (idx: number, val: string) => void;
    onChangeExec: (idx: number, val: string) => void;
  }> = ({ steps, actualMap, execMap, onChangeActual, onChangeExec }) => {
    if (!Array.isArray(steps) || steps.length === 0) {
      return <span className="text-custom-text-300">暂无内容</span>;
    }
    const headerStyle = { backgroundColor: "#f5f5f5", padding: 12, border: "1px solid #e8e8e8" } as const;
    const cellStyle = { padding: 12, border: "1px solid #e8e8e8" } as const;
    const resultOptions = React.useMemo(() => {
      const map = enumsData?.plan_case_result || {};
      const options = Object.keys(map).map((key) => ({ label: <Tag color={map[key]}>{key}</Tag>, value: key }));
      const existingValues = Object.values(execMap || {}).filter(Boolean) as string[];
      existingValues.forEach((v) => {
        if (!options.find((o) => String(o.value) === String(v))) {
          options.push({ label: <Tag>{v}</Tag>, value: v } as any);
        }
      });
      return options;
    }, [enumsData, execMap]);

    const EditableTextArea: React.FC<{ value: string; onCommit: (v: string) => void; placeholder?: string }> = ({
      value,
      onCommit,
      placeholder,
    }) => {
      const [v, setV] = React.useState<string>(value || "");
      React.useEffect(() => {
        setV(value || "");
      }, [value]);
      return (
        <Input.TextArea
          value={v}
          onChange={(e) => setV(e.target.value)}
          onBlur={() => onCommit(v)}
          bordered={false}
          autoSize={{ minRows: 1 }}
          style={{ maxHeight: 300, overflow: "auto" }}
          placeholder={placeholder || "请输入实际结果"}
          className="text-sm resize-none"
        />
      );
    };
    const dataSource = React.useMemo(
      () => (steps || []).map((s, idx) => ({ ...s, actualValue: actualMap[idx] || "", execValue: execMap[idx] || "" })),
      [steps, actualMap, execMap]
    );
    const columns = React.useMemo(
      () => [
        {
          title: "序号",
          key: "index",
          width: 80,
          render: (_: any, __: any, idx: number) => idx + 1,
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
          key: "actual_result",
          shouldCellUpdate: (record: any, prevRecord: any) => record.actualValue !== prevRecord.actualValue,
          render: (_: any, record: any, idx: number) => (
            <div className="w-full rounded border border-transparent hover:border-[#1890ff] transition-colors">
              <EditableTextArea value={record.actualValue} onCommit={(val) => onChangeActual(idx, val)} />
            </div>
          ),
          onHeaderCell: () => ({ style: headerStyle }),
          onCell: () => ({ style: cellStyle }),
        },
        {
          title: "步骤执行结果",
          key: "exec_result",
          shouldCellUpdate: (record: any, prevRecord: any) => record.execValue !== prevRecord.execValue,
          render: (_: any, record: any, idx: number) => (
            <Select
              placeholder="请选择执行结果"
              options={resultOptions as any}
              value={record.execValue}
              onChange={(v) => onChangeExec(idx, String(v))}
              variant="borderless"
              className="w-full text-sm"
              suffixIcon={null}
            />
          ),
          onHeaderCell: () => ({ style: headerStyle }),
          onCell: () => ({ style: cellStyle }),
        },
      ],
      [resultOptions, onChangeActual, onChangeExec]
    );
    return (
      <div className="rounded border border-custom-border-200">
        <div className="overflow-x-auto">
          <Table
            size="small"
            pagination={false}
            bordered={false}
            rowKey={(r: any) => String(r?.__key)}
            dataSource={dataSource}
            columns={columns as any}
          />
        </div>
      </div>
    );
  };
  const StepsTable = React.memo(StepsTableBase);

  return (
    <div className="flex flex-col gap-3 p-4 w-full">
      <PageHead title="用例详情" />
      <Breadcrumbs>
        <Breadcrumbs.Item component={<BreadcrumbBack label="测试计划" steps={2} />} />
        <Breadcrumbs.Item component={<BreadcrumbBack label="测试计划详情" steps={1} />} />
        <Breadcrumbs.Item component={<div className="text-custom-text-200">用例详情</div>} />
      </Breadcrumbs>

      <Transition show={mounted} enter="transition-opacity duration-200" enterFrom="opacity-0" enterTo="opacity-100">
        <Row className="w-full rounded-md border border-custom-border-200 overflow-hidden" gutter={0}>
          <Col flex="30%" className="border-r border-custom-border-200">
            <div className="p-4 flex flex-col gap-3">
              <Input.Search
                placeholder="按用例名称搜索"
                allowClear
                onSearch={(v) => {
                  setKeyword(v);
                  debouncedSearch.cancel();
                  fetchCases(1, pageSize, v);
                }}
                onChange={(e) => {
                  const v = e.target.value;
                  setKeyword(v);
                  if (v.trim() === "") {
                    debouncedSearch.cancel();
                    fetchCases(1, pageSize, "");
                  } else {
                    debouncedSearch(v);
                  }
                }}
              />
              {listLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Spin />
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-2">
                  <div className="text-red-800 text-sm">{error}</div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div
                    ref={leftRef}
                    onScroll={() => onSyncScroll("left")}
                    className="overflow-y-auto vertical-scrollbar scrollbar-sm flex flex-col gap-3 pr-2 pl-1 py-1 max-h-[calc(100dvh-52px-12px)]"
                    style={{ scrollbarGutter: "stable" }}
                  >
                    {cases.length === 0 ? (
                      <div className="text-custom-text-300 py-12 text-center">暂无数据</div>
                    ) : (
                      cases.map((item) => {
                        const caseId = String(item.case);
                        const isActive = String(selectedCaseId || "") === caseId;
                        return (
                          <Card
                            key={item.id}
                            bordered
                            hoverable
                            onClick={() => {
                              setSelectedCaseId(caseId);
                              fetchCaseDetail(caseId);
                            }}
                            className={`${isActive ? "ring-2 ring-blue-500" : ""} rounded-md hover:shadow-sm transition-shadow`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium truncate">{item.name}</div>
                              <Tag color={(enumsData?.plan_case_result || {})[String(item.result)]}>
                                {item.result || "-"}
                              </Tag>
                            </div>
                          </Card>
                        );
                      })
                    )}
                  </div>
                  <Pagination
                    size="small"
                    current={page}
                    pageSize={pageSize}
                    total={total}
                    showSizeChanger
                    showQuickJumper
                    pageSizeOptions={[10, 20, 50, 100] as any}
                    onChange={(p, s) => {
                      setPage(p);
                      setPageSize(s);
                      fetchCases(p, s, keyword);
                    }}
                  />
                </div>
              )}
            </div>
          </Col>

          <Col
            flex="70%"
            className="overflow-y-auto vertical-scrollbar scrollbar-sm scroll-smooth max-h-[calc(100dvh-52px-12px)]"
            style={{ scrollPaddingBottom: 16 }}
            ref={rightRef}
            onScroll={() => onSyncScroll("right")}
          >
            <div className="p-4 pb-16" style={{ scrollPaddingBottom: 16 }}>
              {!selectedCaseId ? (
                <div className="text-custom-text-300 py-12 text-center">请从左侧选择一个用例</div>
              ) : detailLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Spin />
                </div>
              ) : !caseDetail ? (
                <div className="text-custom-text-300 py-12 text-center">未获取到用例详情</div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="border-b border-gray-200">
                    <nav className="flex gap-4 overflow-x-auto">
                      <button
                        type="button"
                        onClick={() => setActiveTab("basic")}
                        className={`flex items-center gap-1.5 px-2 py-3 text-sm -mb-px border-b-2 transition-colors ${
                          activeTab === "basic"
                            ? "text-blue-600 border-blue-600"
                            : "text-black border-transparent hover:text-blue-600"
                        }`}
                      >
                        <LucideIcons.Info size={16} aria-hidden="true" />
                        基本信息
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("requirement")}
                        className={`flex items-center gap-1.5 px-2 py-3 text-sm -mb-px border-b-2 transition-colors ${
                          activeTab === "requirement"
                            ? "text-blue-600 border-blue-600"
                            : "text-black border-transparent hover:text-blue-600"
                        }`}
                      >
                        <LucideIcons.FileText size={16} aria-hidden="true" />
                        产品需求
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("work")}
                        className={`flex items-center gap-1.5 px-2 py-3 text-sm -mb-px border-b-2 transition-colors ${
                          activeTab === "work"
                            ? "text-blue-600 border-blue-600"
                            : "text-black border-transparent hover:text-blue-600"
                        }`}
                      >
                        <LucideIcons.ListTodo size={16} aria-hidden="true" />
                        工作项
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("defect")}
                        className={`flex items-center gap-1.5 px-2 py-3 text-sm -mb-px border-b-2 transition-colors ${
                          activeTab === "defect"
                            ? "text-blue-600 border-blue-600"
                            : "text-black border-transparent hover:text-blue-600"
                        }`}
                      >
                        <LucideIcons.Bug size={16} aria-hidden="true" />
                        缺陷
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          setActiveTab("history");
                          if (!workspaceSlug || !planId || !selectedCaseId) return;
                          try {
                            await planService.getPlanCaseRecord(String(workspaceSlug), {
                              plan_id: String(planId),
                              case_id: String(selectedCaseId),
                            });
                          } catch {}
                        }}
                        className={`flex items-center gap-1.5 px-2 py-3 text-sm -mb-px border-b-2 transition-colors ${
                          activeTab === "history"
                            ? "text-blue-600 border-blue-600"
                            : "text-black border-transparent hover:text-blue-600"
                        }`}
                      >
                        <LucideIcons.History size={16} aria-hidden="true" />
                        执行历史
                      </button>
                    </nav>
                  </div>

                  <div>
                    <Transition
                      show={activeTab === "basic"}
                      enter="transition duration-150 ease-out"
                      enterFrom="transform scale-95 opacity-0"
                      enterTo="transform scale-100 opacity-100"
                      leave="transition duration-100 ease-in"
                      leaveFrom="transform scale-100 opacity-100"
                      leaveTo="transform scale-95 opacity-0"
                    >
                      {activeTab === "basic" && (
                        <div className="flex flex-col gap-4 h-[550px] overflow-y-auto vertical-scrollbar scrollbar-sm">
                          <div className="text-lg font-semibold">{caseDetail?.name ?? "-"}</div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <div className="col-span-1">
                              <div className="text-xs text-custom-text-300 mb-1">维护人</div>
                              {caseDetail?.assignee ? (
                                <MemberDropdown
                                  multiple={false}
                                  value={caseDetail.assignee.id}
                                  onChange={() => {}}
                                  disabled={true}
                                  placeholder={getUserDetails(caseDetail.assignee)?.display_name || "未知用户"}
                                  className="w-full text-sm h-8"
                                  buttonContainerClassName="w-full text-left p-0 cursor-default h-8 flex items-center"
                                  buttonVariant="transparent-with-text"
                                  buttonClassName="text-sm p-0 hover:bg-transparent hover:bg-inherit h-8"
                                  showUserDetails={true}
                                  optionsClassName="z-[60]"
                                />
                              ) : (
                                <div className="p-2 text-sm text-custom-text-300 h-8 flex items-center">
                                  未设置维护人
                                </div>
                              )}
                            </div>
                            <div className="col-span-1">
                              <div className="text-xs text-custom-text-300 mb-1">类型</div>
                              <div className="h-8 flex items-center">
                                <Tag>{enumsData.case_type?.[String(caseDetail?.type)] ?? "-"}</Tag>
                              </div>
                            </div>
                            <div className="col-span-1">
                              <div className="text-xs text-custom-text-300 mb-1">等级</div>
                              <div className="h-8 flex items-center">
                                <Tag>{enumsData.case_priority?.[String(caseDetail?.priority)] ?? "-"}</Tag>
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700">
                              <LucideIcons.ListChecks size={16} aria-hidden="true" />
                              前置条件
                            </label>
                            <RichTextEditor
                              value={String(caseDetail?.precondition ?? "")}
                              onChange={() => {}}
                              onBlur={() => {}}
                              aria-label="前置条件"
                              placeholder="暂无内容"
                              editable={false}
                            />
                          </div>

                          <div>
                            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                              <LucideIcons.ListOrdered size={16} aria-hidden="true" />
                              测试步骤
                            </label>
                            <StepsTable
                              steps={displaySteps}
                              actualMap={stepActualResultMap}
                              execMap={stepExecResultMap}
                              onChangeActual={handleChangeActual}
                              onChangeExec={handleChangeExec}
                            />
                          </div>

                          <div>
                            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                              <LucideIcons.StickyNote size={16} aria-hidden="true" />
                              备注
                            </label>
                            <RichTextEditor
                              value={caseDetail?.remark}
                              onChange={() => {}}
                              onBlur={() => {}}
                              aria-label="备注"
                              placeholder="暂无内容"
                              editable={false}
                            />
                          </div>

                          <div id="attachments-section" className="scroll-mb-16">
                            <div className="mb-2 flex items-center justify-between">
                              <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <LucideIcons.Paperclip size={16} aria-hidden="true" />
                                附件
                              </span>
                            </div>
                            {attachments.length === 0 ? (
                              <div className="p-3 text-sm text-custom-text-300">暂无附件</div>
                            ) : (
                              <Table
                                size="small"
                                pagination={false}
                                rowKey={(r: any) => String(r?.id)}
                                dataSource={attachments}
                                columns={[
                                  {
                                    title: "文件名",
                                    dataIndex: ["attributes", "name"],
                                    key: "name",
                                    render: (_: any, record: any) => (
                                      <span className="truncate block max-w-[480px]">
                                        {String(record?.attributes?.name || record?.filename || record?.id)}
                                      </span>
                                    ),
                                  },
                                  {
                                    title: "操作",
                                    key: "action",
                                    width: 120,
                                    render: (_: any, record: any) => (
                                      <Tooltip title="下载">
                                        <Button
                                          type="link"
                                          size="small"
                                          onClick={() => handleDownloadAttachment(record)}
                                        >
                                          下载
                                        </Button>
                                      </Tooltip>
                                    ),
                                  },
                                ]}
                              />
                            )}
                          </div>
                        </div>
                      )}
                    </Transition>

                    <Transition
                      show={activeTab === "requirement"}
                      enter="transition duration-150 ease-out"
                      enterFrom="transform scale-95 opacity-0"
                      enterTo="transform scale-100 opacity-100"
                      leave="transition duration-100 ease-in"
                      leaveFrom="transform scale-100 opacity-100"
                      leaveTo="transform scale-95 opacity-0"
                    >
                      {activeTab === "requirement" && selectedCaseId && (
                        <div className="mt-4 h-[550px] overflow-y-auto vertical-scrollbar scrollbar-sm">
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-sm text-gray-600">{currentCount}个产品需求</div>
                          </div>
                          <WorkItemDisplayModal caseId={String(selectedCaseId)} defaultType="Requirement" />
                        </div>
                      )}
                    </Transition>

                    <Transition
                      show={activeTab === "work"}
                      enter="transition duration-150 ease-out"
                      enterFrom="transform scale-95 opacity-0"
                      enterTo="transform scale-100 opacity-100"
                      leave="transition duration-100 ease-in"
                      leaveFrom="transform scale-100 opacity-100"
                      leaveTo="transform scale-95 opacity-0"
                    >
                      {activeTab === "work" && selectedCaseId && (
                        <div className="mt-4 h-[550px] overflow-y-auto vertical-scrollbar scrollbar-sm">
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-sm text-gray-600">{currentCount}个工作项</div>
                          </div>
                          <WorkItemDisplayModal caseId={String(selectedCaseId)} defaultType="Task" />
                        </div>
                      )}
                    </Transition>

                    <Transition
                      show={activeTab === "defect"}
                      enter="transition duration-150 ease-out"
                      enterFrom="transform scale-95 opacity-0"
                      enterTo="transform scale-100 opacity-100"
                      leave="transition duration-100 ease-in"
                      leaveFrom="transform scale-100 opacity-100"
                      leaveTo="transform scale-95 opacity-0"
                    >
                      {activeTab === "defect" && selectedCaseId && (
                        <div className="mt-4 h-[550px] overflow-y-auto vertical-scrollbar scrollbar-sm">
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-sm text-gray-600">{currentCount}个缺陷</div>
                          </div>
                          <WorkItemDisplayModal
                            caseId={String(selectedCaseId)}
                            defaultType="Bug"
                            reloadToken={recordsRefreshKey}
                          />
                        </div>
                      )}
                    </Transition>

                    <Transition
                      show={activeTab === "history"}
                      enter="transition duration-150 ease-out"
                      enterFrom="transform scale-95 opacity-0"
                      enterTo="transform scale-100 opacity-100"
                      leave="transition duration-100 ease-in"
                      leaveFrom="transform scale-100 opacity-100"
                      leaveTo="transform scale-95 opacity-0"
                    >
                      {activeTab === "history" && (
                        <ExecutionRecordsPanel
                          key={`${selectedCaseId}-${recordsRefreshKey}`}
                          workspaceSlug={workspaceSlug}
                          reviewId={reviewId}
                          caseId={selectedCaseId}
                        />
                      )}
                    </Transition>
                  </div>

                  <div className="w-full" style={{ borderTop: "1px solid #f0f0f0" }}>
                    <div className="px-0 py-3 flex flex-col gap-3">
                      <Radio.Group onChange={handleRadioChange} value={reviewValue} disabled={!selectedCaseId}>
                        {Object.keys(enumsData?.plan_case_result || {})
                          .filter((k) => k !== "未执行")
                          .map((k, idx) => (
                            <Radio key={k} value={k} className={idx > 0 ? "ml-6" : undefined}>
                              <Tag color={(enumsData?.plan_case_result || {})[k]}>{k}</Tag>
                            </Radio>
                          ))}
                      </Radio.Group>
                      <div>
                        <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                          原因说明
                        </label>
                        <Input.TextArea
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          rows={4}
                          placeholder="请输入原因（必要时）"
                          allowClear
                          onKeyDownCapture={(e) => {
                            if (e.ctrlKey || e.metaKey || e.altKey || e.key === "Escape" || e.key === "Tab") return;
                            e.stopPropagation();
                          }}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="primary"
                            onClick={handleSubmitReview}
                            loading={submitLoading}
                            disabled={!selectedCaseId}
                          >
                            提交结果
                          </Button>
                          <Tooltip title="为当前用例创建一个缺陷工作项">
                            <Button type="primary" onClick={handleOpenCreateDefect} disabled={!workspaceSlug}>
                              新增缺陷
                            </Button>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Col>
        </Row>
      </Transition>
      <BugIssueModal
        isOpen={isCreateDefectOpen}
        onClose={() => setIsCreateDefectOpen(false)}
        modalTitle="新增缺陷"
        isDraft={false}
        initialDescriptionHtml={buildStepsHtml()}
        onSubmit={async (res) => {
          try {
            setIsCreateDefectOpen(false);
            if (activeTab === "defect") setRecordsRefreshKey((k) => k + 1);
            message.success("缺陷创建成功");
            const bugId = String((res as any)?.id ?? "");
            const caseId = String(selectedCaseId ?? "");
            if (workspaceSlug && bugId && caseId) {
              const plan = new PlanApiService();
              await plan.addCaseBug(String(workspaceSlug), { case_id: caseId, issue_id: bugId });
              message.success("已绑定缺陷与用例");
            }
          } catch (e: any) {
            const msg = e?.message || e?.detail || e?.error || "缺陷创建或绑定失败";
            message.error(msg);
          }
        }}
      />
    </div>
  );
}
