"use client";
import React from "react";
import { Transition } from "@headlessui/react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { PageHead } from "@/components/core/page-title";
import { Breadcrumbs } from "@plane/ui";
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { Row, Col, Card, Input, Pagination, Tag, Spin, message, Button, Table, Tooltip, Radio, Modal } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import debounce from "lodash-es/debounce";
import { CaseService as CaseApiService } from "@/services/qa/case.service";
import { CaseService as ReviewApiService } from "@/services/qa/review.service";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { getEnums } from "app/(all)/[workspaceSlug]/(projects)/test-management/util";
import * as LucideIcons from "lucide-react";
import { useMember } from "@/hooks/store/use-member";
import { useUser } from "@/hooks/store/user";
import { RichTextEditor } from "../cases/util";
import { WorkItemDisplayModal } from "../cases/work-item-display-modal";
import { ReviewRecordsPanel } from "./review-records";

type ReviewCaseRow = {
  id: string | number;
  case_id: string | number;
  name: string;
  priority: number;
  assignees: Array<string>;
  result: string;
  created_by: string | number | null;
};

const priorityLabelMap: Record<number, string> = { 0: "低", 1: "中", 2: "高" };

const getCaseStateTagColor = (text: string): "blue" | "green" | "red" | "default" => {
  switch (text) {
    case "待评审":
      return "blue";
    case "已通过":
      return "green";
    case "已拒绝":
      return "red";
    default:
      return "default";
  }
};

export default function CaseReview() {
  const { workspaceSlug } = useParams() as { workspaceSlug?: string };
  const searchParams = useSearchParams();
  const router = useRouter();
  const reviewId = searchParams.get("review_id") ?? "";
  const initialCaseId = searchParams.get("case_id") ?? undefined;

  const caseService = React.useMemo(() => new CaseApiService(), []);
  const reviewService = React.useMemo(() => new ReviewApiService(), []);
  const {
    getUserDetails,
    workspace: { fetchWorkspaceMembers },
  } = useMember();
  const { data: currentUser } = useUser();

  const [reviewEnums, setReviewEnums] = React.useState<
    Record<string, Record<string, { label: string; color: string }>>
  >({});
  const [listLoading, setListLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [cases, setCases] = React.useState<ReviewCaseRow[]>([]);
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
  }>({});
  const [attachments, setAttachments] = React.useState<any[]>([]);
  const [activeTab, setActiveTab] = React.useState<"basic" | "requirement" | "work" | "defect" | "history">("basic");
  const [currentCount, setCurrentCount] = React.useState<number>(0);
  const [reviewValue, setReviewValue] = React.useState<"通过" | "不通过" | "建议" | null>("通过");
  const [reason, setReason] = React.useState<string>("");
  const [reasonModalOpen, setReasonModalOpen] = React.useState<boolean>(false);
  const [submitLoading, setSubmitLoading] = React.useState<boolean>(false);
  const [recordsRefreshKey, setRecordsRefreshKey] = React.useState<number>(0);
  const [isCurrentUserReviewer, setIsCurrentUserReviewer] = React.useState<boolean>(false);

  const fetchReviewEnums = async () => {
    if (!workspaceSlug) return;
    try {
      const data = await reviewService.getReviewEnums(String(workspaceSlug));
      setReviewEnums(data || {});
    } catch {}
  };

  const fetchCases = async (p = page, s = pageSize, kw?: string) => {
    if (!workspaceSlug || !reviewId) return;
    try {
      setListLoading(true);
      setError(null);
      const input = (kw ?? keyword).trim();
      const res = await reviewService.getReviewCaseList(String(workspaceSlug), String(reviewId), {
        page: p,
        page_size: s,
        ...(input ? { name__icontains: input } : {}),
      });
      setCases(Array.isArray(res?.data) ? (res.data as ReviewCaseRow[]) : []);
      setTotal(Number(res?.count || 0));
      setPage(p);
      setPageSize(s);
    } catch (e: any) {
      const msg = e?.message || e?.detail || e?.error || "获取评审用例列表失败";
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
      });
    } catch {}
  };

  const fetchCaseDetail = async (id?: string) => {
    const targetId = id ?? selectedCaseId;
    if (!workspaceSlug || !targetId) return;
    try {
      setDetailLoading(true);
      const data = await caseService.getCase(String(workspaceSlug), String(targetId));
      setCaseDetail(data);
      try {
        const list = await caseService.getCaseAssetList(String(workspaceSlug), String(targetId));
        setAttachments(Array.isArray(list) ? list : []);
      } catch {
        setAttachments([]);
      }
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
    fetchReviewEnums();
  }, [workspaceSlug]);

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
  }, [workspaceSlug, reviewId]);

  React.useEffect(() => {
    if (initialCaseId) fetchCaseDetail(initialCaseId);
  }, [initialCaseId]);

  React.useEffect(() => {
    const map: Record<string, string> = {
      requirement: "史诗,特性,用户故事",
      work: "任务",
      defect: "缺陷",
    };
    const type_name = map[activeTab];
    if (!type_name || !workspaceSlug || !selectedCaseId) {
      setCurrentCount(0);
      return;
    }
    caseService
      .issueList(String(workspaceSlug), { case_id: String(selectedCaseId), type_name })
      .then((res) => {
        const list = Array.isArray((res as any)?.data)
          ? ((res as any).data as any[])
          : Array.isArray(res)
            ? (res as any[])
            : [];
        const count = (res as any)?.count ?? list.length;
        setCurrentCount(count);
      })
      .catch(() => setCurrentCount(0));
  }, [activeTab, workspaceSlug, selectedCaseId]);

  const debouncedSearch = React.useMemo(
    () =>
      debounce((v: string) => {
        fetchCases(1, pageSize, v);
      }, 300),
    [pageSize, workspaceSlug, reviewId]
  );

  React.useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  type StepItem = { result: string; description: string };

  const StepsTable: React.FC<{ steps?: StepItem[] }> = ({ steps }) => {
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

  const handleRadioChange = (e: any) => {
    const val = String(e?.target?.value || "") as "通过" | "不通过" | "建议";
    if (val !== reviewValue) {
      setReason("");
    }
    setReviewValue(val);
    if (val === "不通过" || val === "建议") {
      setReasonModalOpen(true);
    }
  };

  React.useEffect(() => {
    const row = cases.find((item) => String(item.case_id ?? item.id) === String(selectedCaseId || ""));
    const reviewers = Array.isArray(row?.assignees) ? row!.assignees.map((id) => String(id)) : [];
    const isReviewer = currentUser?.id ? reviewers.includes(String(currentUser.id)) : false;
    setIsCurrentUserReviewer(isReviewer);
  }, [cases, selectedCaseId, currentUser?.id]);

  React.useEffect(() => {
    if (!selectedCaseId) return;
    const row = cases.find((item) => String(item.case_id ?? item.id) === String(selectedCaseId || ""));
    const reviewers = Array.isArray(row?.assignees) ? row!.assignees.map((id) => String(id)) : [];
    const isReviewer = currentUser?.id ? reviewers.includes(String(currentUser.id)) : false;
    setReviewValue(isReviewer ? "通过" : "建议");
    setReason("");
  }, [selectedCaseId, cases, currentUser?.id]);

  const buildPayload = () => {
    if (!workspaceSlug || !reviewId || !selectedCaseId || !reviewValue) return null;
    if (!isCurrentUserReviewer && reviewValue !== "建议") return null;
    const payload: any = {
      review_id: String(reviewId),
      case_id: String(selectedCaseId),
      result: ({ 通过: "通过", 不通过: "不通过", 建议: "建议" } as const)[reviewValue],
    };
    if (reason && reason.trim()) payload.reason = reason.trim();
    if (currentUser?.id) payload.assignee = String(currentUser.id);
    return payload;
  };

  const debouncedSubmit = React.useMemo(
    () =>
      debounce(async (payload: any) => {
        if (!payload) return;
        setSubmitLoading(true);
        try {
          await caseService.submitCaseReview(String(workspaceSlug), payload);
          message.success("评审提交成功");
          setReasonModalOpen(false);
          setReason("");
          fetchCases(page, pageSize);
          setRecordsRefreshKey((k) => k + 1);
        } catch (e: any) {
          const msg = e?.message || e?.detail || e?.error || "提交评审失败";
          message.error(msg);
        } finally {
          setSubmitLoading(false);
        }
      }, 500),
    [workspaceSlug, page, pageSize]
  );

  React.useEffect(() => {
    return () => {
      debouncedSubmit.cancel();
    };
  }, [debouncedSubmit]);

  const handleSubmitReview = () => {
    const payload = buildPayload();
    if (!payload) {
      if (!isCurrentUserReviewer) {
        message.warning("您不是该评审的评审人员，仅可提交建议");
      } else {
        message.warning("请选择评审结果");
      }
      return;
    }
    if ((reviewValue === "不通过" || reviewValue === "建议") && !reason.trim()) {
      setReasonModalOpen(true);
      return;
    }
    debouncedSubmit(payload);
  };

  return (
    <div className="flex flex-col gap-3 p-4 w-full">
      <PageHead title="用例详情" />
      <Breadcrumbs>
        <Breadcrumbs.Item
          component={<BreadcrumbLink href={`/${workspaceSlug}/test-management/plans`} label="测试计划" />}
        />
        <Breadcrumbs.Item
          component={
            <BreadcrumbLink
              href={`/${workspaceSlug}/test-management/caseManagementReviewDetail?review_id=${encodeURIComponent(String(reviewId))}`}
              label="测试计划详情"
            />
          }
        />
        <Breadcrumbs.Item component={<BreadcrumbLink label="用例详情" isLast />} />
      </Breadcrumbs>

      <Row className="w-full rounded-md border border-custom-border-200 overflow-hidden" gutter={0}>
        <Col flex="390px" className="border-r border-custom-border-200">
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
                  className="h-[680px] overflow-y-auto vertical-scrollbar scrollbar-sm flex flex-col gap-3 pr-2 pl-1 py-1"
                  style={{ scrollbarGutter: "stable" }}
                >
                  {cases.length === 0 ? (
                    <div className="text-custom-text-300 py-12 text-center">暂无数据</div>
                  ) : (
                    cases.map((item) => {
                      const caseId = String(item.case_id ?? item.id);
                      const isActive = String(selectedCaseId || "") === caseId;
                      const color = reviewEnums?.CaseReviewThrough_Result?.[item.result]?.color || "default";
                      return (
                        <Card
                          key={item.id}
                          bordered
                          hoverable
                          onClick={() => {
                            const reviewers = Array.isArray(item.assignees)
                              ? item.assignees.map((id) => String(id))
                              : [];
                            const isReviewer = currentUser?.id ? reviewers.includes(String(currentUser.id)) : false;
                            setSelectedCaseId(caseId);
                            setReviewValue(isReviewer ? "通过" : "建议");
                            setReason("");
                            fetchCaseDetail(caseId);
                          }}
                          className={`${isActive ? "ring-2 ring-blue-500" : ""} rounded-md hover:shadow-sm transition-shadow`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium truncate">{item.name}</div>
                            <Tag color={color}>{item.result || "-"}</Tag>
                          </div>
                          <div className="mt-2 flex items-center gap-2"></div>
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
          flex="auto"
          className="overflow-y-auto vertical-scrollbar scrollbar-sm scroll-smooth max-h-[calc(100dvh-52px-12px)] min-h-[300px]"
          style={{ scrollPaddingBottom: 16 }}
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
                      onClick={() => setActiveTab("history")}
                      className={`flex items-center gap-1.5 px-2 py-3 text-sm -mb-px border-b-2 transition-colors ${
                        activeTab === "history"
                          ? "text-blue-600 border-blue-600"
                          : "text-black border-transparent hover:text-blue-600"
                      }`}
                    >
                      <LucideIcons.History size={16} aria-hidden="true" />
                      评审历史
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
                              <div className="p-2 text-sm text-custom-text-300 h-8 flex items-center">未设置维护人</div>
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
                          <StepsTable steps={caseDetail?.steps as StepItem[]} />
                        </div>

                        <div>
                          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                            <LucideIcons.StickyNote size={16} aria-hidden="true" />
                            备注
                          </label>
                          <RichTextEditor
                            value={caseDetail.remark}
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
                                      <Button type="link" size="small" onClick={() => handleDownloadAttachment(record)}>
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
                        <WorkItemDisplayModal caseId={String(selectedCaseId)} defaultType="Bug" />
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
                      <ReviewRecordsPanel
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
                    <div className="text-sm font-normal">开始评审</div>
                    <Radio.Group onChange={handleRadioChange} value={reviewValue} disabled={!selectedCaseId}>
                      <Radio value="通过" disabled={!isCurrentUserReviewer}>
                        <span style={{ color: "#52c41a" }} className="flex items-center gap-1">
                          <CheckCircleOutlined /> 通过
                        </span>
                      </Radio>
                      <Radio value="不通过" className="ml-6" disabled={!isCurrentUserReviewer}>
                        <span style={{ color: "#f5222d" }} className="flex items-center gap-1">
                          <CloseCircleOutlined /> 不通过
                        </span>
                      </Radio>
                      <Radio value="建议" className="ml-6">
                        <span style={{ color: "#fa8c16" }} className="flex items-center gap-1">
                          <ExclamationCircleOutlined /> 建议
                        </span>
                      </Radio>
                    </Radio.Group>
                    <div>
                      <Button type="link" onClick={() => setReasonModalOpen(true)} disabled={!selectedCaseId}>
                        添加原因
                      </Button>
                    </div>
                    <div>
                      <Button
                        type="primary"
                        onClick={handleSubmitReview}
                        loading={submitLoading}
                        disabled={!selectedCaseId}
                      >
                        提交评审
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Col>
      </Row>
      <Modal
        title="填写评审原因"
        open={reasonModalOpen}
        onCancel={() => setReasonModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setReasonModalOpen(false)}>
            取消
          </Button>,
          <Button key="submit" type="primary" loading={submitLoading} onClick={handleSubmitReview}>
            提交评审
          </Button>,
        ]}
      >
        <Input.TextArea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          placeholder="请输入不通过或建议的原因"
          allowClear
        />
      </Modal>
    </div>
  );
}
