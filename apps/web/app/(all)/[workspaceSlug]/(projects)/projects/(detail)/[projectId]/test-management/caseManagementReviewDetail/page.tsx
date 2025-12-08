"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef, useMemo } from "react";
import { PageHead } from "@/components/core/page-title";
import { Breadcrumbs } from "@plane/ui";
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { Row, Col, Tree, Table, Button, Tag, message } from "antd";
import type { TreeProps } from "antd";
import { AppstoreOutlined, DeploymentUnitOutlined } from "@ant-design/icons";
import { CaseService as CaseApiService } from "@/services/qa/case.service";
import { CaseService as ReviewApiService } from "@/services/qa/review.service";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { FolderOpenDot } from "lucide-react";

type TCreator = {
  display_name?: string;
};

type TLabel =
  | {
      id?: string;
      name?: string;
    }
  | string;

type TestCase = {
  id: string;
  name: string;
  remark?: string;
  state?: number;
  type?: number;
  priority?: number;
  created_at?: string;
  updated_at?: string;
  created_by?: TCreator;
  repository?: string;
  labels?: TLabel[];
};

type ReviewCaseRow = {
  id: string;
  case_id: string;
  name: string;
  priority: number;
  assignees: string[];
  result: string;
  created_by: string | null;
};

export default function CaseManagementReviewDetailPage() {
  const { workspaceSlug } = useParams();
  const searchParams = useSearchParams();
  const reviewId = searchParams.get("review_id") ?? "";
  const repositoryIdFromUrl = searchParams.get("repositoryId");
  const repositoryId =
    repositoryIdFromUrl || (typeof window !== "undefined" ? sessionStorage.getItem("selectedRepositoryId") : null);
  const router = useRouter();

  const caseService = useMemo(() => new CaseApiService(), []);
  const reviewService = useMemo(() => new ReviewApiService(), []);

  const [modules, setModules] = useState<any[]>([]);
  const [allTotal, setAllTotal] = useState<number | undefined>(undefined);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<string[] | undefined>(undefined);
  const [autoExpandParent, setAutoExpandParent] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewCases, setReviewCases] = useState<ReviewCaseRow[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);
  const treeInitializedRef = useRef<boolean>(false);
  const [reviewEnums, setReviewEnums] = useState<Record<string, Record<string, { label: string; color: string }>>>({});
  const [leftWidth, setLeftWidth] = useState<number>(300);
  const isDraggingRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  const onExpand: TreeProps["onExpand"] = (keys) => {
    setExpandedKeys(keys as string[]);
    setAutoExpandParent(false);
  };

  const batchUpdateModuleCounts = (list: any[], countsMap: Record<string, number>) => {
    if (!Array.isArray(list)) return [];
    return list.map((m) => {
      const updatedM: any = { ...m };
      const idStr = String(m?.id);
      if (countsMap && Object.prototype.hasOwnProperty.call(countsMap, idStr)) {
        updatedM.total = countsMap[idStr];
      }
      if (m.children) {
        updatedM.children = batchUpdateModuleCounts(m.children, countsMap);
      }
      return updatedM;
    });
  };

  const fetchModules = async () => {
    if (!workspaceSlug || !repositoryId) return;
    try {
      const moduleData = await caseService.getModules(workspaceSlug as string, repositoryId as string);
      const countsResponse = await reviewService.getModuleCount(workspaceSlug as string, reviewId as string);
      const { total: t = 0, ...countsMap } = countsResponse as any;
      setAllTotal(t as number);
      const updated = batchUpdateModuleCounts(moduleData, countsMap as Record<string, number>);
      setModules(updated);
      if (!treeInitializedRef.current) {
        setExpandedKeys(["all"]);
        setAutoExpandParent(true);
        treeInitializedRef.current = true;
      }
    } catch (e) {
      setError("获取模块数据失败，请稍后重试");
    }
  };

  const fetchReviewEnums = async () => {
    if (!workspaceSlug) return;
    try {
      const data = await reviewService.getReviewEnums(workspaceSlug as string);
      setReviewEnums(data || {});
    } catch (e) {}
  };

  const fetchReviewCaseList = async (page: number = currentPage, size: number = pageSize) => {
    if (!workspaceSlug || !reviewId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await reviewService.getReviewCaseList(workspaceSlug as string, reviewId as string, {
        page,
        page_size: size,
        module_id: selectedModuleId,
      });
      setReviewCases(Array.isArray(res?.data) ? (res.data as ReviewCaseRow[]) : []);
      setTotal(Number(res?.count || 0));
      setCurrentPage(page);
      setPageSize(size);
    } catch (e: any) {
      setError(e?.message || e?.detail || e?.error || "获取评审用例列表失败");
      message.error(e?.message || e?.detail || e?.error || "获取评审用例列表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (repositoryId) {
      try {
        if (repositoryIdFromUrl) sessionStorage.setItem("selectedRepositoryId", repositoryIdFromUrl);
      } catch {}
      fetchModules();
      fetchReviewEnums();
      fetchReviewCaseList(1, pageSize);
    } else {
      setLoading(false);
    }
  }, [repositoryId]);

  const pid = typeof window !== "undefined" ? sessionStorage.getItem("currentProjectId") || "" : "";
  useEffect(() => {
    if (!repositoryId && workspaceSlug) {
      const ws = String(workspaceSlug || "");
      const current = `/${ws}/projects/${pid}/test-management/caseManagementReviewDetail${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
      router.push(`/${ws}/projects/${pid}/test-management?redirect_to=${encodeURIComponent(current)}`);
    }
  }, [repositoryId, workspaceSlug, searchParams, router]);

  const onMouseDownResize = (e: React.MouseEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = leftWidth;
    window.addEventListener("mousemove", onMouseMoveResize as any);
    window.addEventListener("mouseup", onMouseUpResize as any);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    e.preventDefault();
  };

  const onMouseMoveResize = (e: MouseEvent) => {
    if (!isDraggingRef.current) return;
    const next = Math.min(300, Math.max(200, startWidthRef.current + (e.clientX - startXRef.current)));
    setLeftWidth(next);
  };

  const onMouseUpResize = () => {
    isDraggingRef.current = false;
    window.removeEventListener("mousemove", onMouseMoveResize as any);
    window.removeEventListener("mouseup", onMouseUpResize as any);
    document.body.style.cursor = "auto";
    document.body.style.userSelect = "auto";
  };

  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", onMouseMoveResize as any);
      window.removeEventListener("mouseup", onMouseUpResize as any);
    };
  }, []);

  useEffect(() => {
    if (!repositoryId) return;
    fetchReviewCaseList(1, pageSize);
  }, [selectedModuleId]);

  const onSelect: TreeProps["onSelect"] = (selectedKeys, info) => {
    const key = selectedKeys[0] as string | undefined;
    const nextId = !key || key === "all" ? null : key;
    setSelectedModuleId(nextId);
  };

  const getNodeCount = (m: any) => {
    const c = m?.case_count ?? m?.count ?? m?.total ?? m?.cases_count;
    return typeof c === "number" ? c : undefined;
  };

  const renderNodeTitle = (title: string, count?: number) => {
    return (
      <div className="flex items-center justify-between gap-2 w-full">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-5 h-5 text-custom-text-300">
            <FolderOpenDot size={14} />
          </span>
          <span className="text-sm text-custom-text-200">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {typeof count === "number" && <span className="text-xs text-custom-text-300">{count}</span>}
        </div>
      </div>
    );
  };

  const buildTreeNodes = (list: any[]): any[] => {
    if (!Array.isArray(list)) return [];
    return list.map((node: any) => {
      const nodeId = String(node?.id);
      const childrenNodes = buildTreeNodes(node?.children || []);
      return {
        title: renderNodeTitle(node?.name ?? "-", getNodeCount(node)),
        key: nodeId,
        icon: <AppstoreOutlined />,
        children: [...childrenNodes],
      };
    });
  };

  const treeData = [
    {
      title: (
        <div className="flex items-center justify-between gap-2 w-full">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 text-custom-text-300">
              <AppstoreOutlined />
            </span>
            <span className="text-sm font-medium text-custom-text-200">全部模块</span>
          </div>
          <div className="flex items-center gap-2">
            {typeof allTotal === "number" && <span className="text-xs text-custom-text-300">{allTotal}</span>}
          </div>
        </div>
      ),
      key: "all",
      icon: <AppstoreOutlined />,
      children: [...buildTreeNodes(modules)],
    },
  ];

  const priorityLabelMap: Record<number, string> = { 0: "低", 1: "中", 2: "高" };

  const columns = [
    { title: "用例名称", dataIndex: "name", key: "name" },
    {
      title: "用例等级",
      dataIndex: "priority",
      key: "priority",
      render: (v: number) => priorityLabelMap[v] ?? "-",
    },
    {
      title: "评审人",
      dataIndex: "assignees",
      key: "assignees",
      render: (assignees: string[] = []) => (
        <MemberDropdown
          multiple={true}
          value={assignees}
          onChange={() => {}}
          disabled={true}
          placeholder={"未知用户"}
          className="w-full text-sm"
          buttonContainerClassName="w-full text-left p-0 cursor-default"
          buttonVariant="transparent-with-text"
          buttonClassName="text-sm p-0 hover:bg-transparent hover:bg-inherit"
          showUserDetails={true}
          optionsClassName="z-[60]"
        />
      ),
    },
    {
      title: "评审结果",
      dataIndex: "result",
      key: "result",
      render: (result: string) => {
        const color = reviewEnums?.CaseReviewThrough_Result?.[result]?.color || "default";
        return <Tag color={color}>{result || "-"}</Tag>;
      },
    },
    {
      title: "创建人",
      dataIndex: "created_by",
      key: "created_by",
      render: (uid: string | null) => (
        <MemberDropdown
          multiple={false}
          value={uid ?? null}
          onChange={() => {}}
          disabled={true}
          placeholder={"未知用户"}
          className="w-full text-sm"
          buttonContainerClassName="w-full text-left p-0 cursor-default"
          buttonVariant="transparent-with-text"
          buttonClassName="text-sm p-0 hover:bg-transparent hover:bg-inherit"
          showUserDetails={true}
          optionsClassName="z-[60]"
        />
      ),
    },
    {
      title: "操作",
      key: "actions",
      render: (_: any, record: ReviewCaseRow) => (
        <div className="flex items-center gap-2">
          <Button
            type="link"
            size="small"
            onClick={() => {
              if (!workspaceSlug || !reviewId) return;
              const pid = typeof window !== "undefined" ? sessionStorage.getItem("currentProjectId") || "" : "";
              const href = `/${workspaceSlug}/projects/${pid}/test-management/case-review?review_id=${encodeURIComponent(reviewId)}&case_id=${encodeURIComponent(record.case_id)}`;
              router.push(href);
            }}
          >
            评审
          </Button>
          <Button
            type="link"
            size="small"
            danger
            onClick={async () => {
              if (!workspaceSlug || !reviewId) return;
              try {
                await reviewService.CaseCancel(workspaceSlug as string, { ids: [record.id] });
                message.success("已取消关联");
                fetchReviewCaseList(currentPage, pageSize);
              } catch (e: any) {
                message.error(e?.message || e?.detail || e?.error || "操作失败");
              }
            }}
          >
            取消关联
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-3 p-4 w-full">
      <PageHead title="评审详情" />
      <Breadcrumbs>
        <Breadcrumbs.Item
          component={
            <BreadcrumbLink href={`/${workspaceSlug}/projects/${pid}/test-management/reviews`} label="用例评审" />
          }
        />
        <Breadcrumbs.Item component={<BreadcrumbLink label="评审详情" isLast />} />
      </Breadcrumbs>
      <Row className="w-full rounded-md border border-custom-border-200 overflow-hidden" gutter={0}>
        <Col flex={`${leftWidth}px`} className="relative border-r border-custom-border-200">
          <div className="p-4">
            {!repositoryId && <div className="text-custom-text-300">未找到用例库ID，请先在顶部选择一个用例库</div>}
            {repositoryId && (
              <Tree
                showLine={false}
                defaultExpandAll
                onSelect={onSelect}
                onExpand={onExpand}
                expandedKeys={expandedKeys}
                autoExpandParent={autoExpandParent}
                treeData={treeData as any}
                selectedKeys={selectedModuleId ? [selectedModuleId] : ["all"]}
                className="py-2"
              />
            )}
          </div>
          <div className="absolute top-0 right-[-2px] w-1 h-full cursor-col-resize" onMouseDown={onMouseDownResize} />
        </Col>
        <Col flex="auto" className="overflow-y-auto">
          <div className="p-4">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-custom-text-300">加载中...</div>
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                <div className="text-red-800 text-sm">{error}</div>
              </div>
            )}
            {repositoryId && !loading && !error && (
              <Table
                dataSource={reviewCases}
                columns={columns as any}
                rowKey="id"
                bordered={true}
                pagination={{
                  current: currentPage,
                  pageSize,
                  total,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (t, r) => `第 ${r[0]}-${r[1]} 条，共 ${t} 条`,
                  pageSizeOptions: ["10", "20", "50", "100"],
                }}
                locale={{ emptyText: "暂无数据" }}
                onChange={(pagination) => {
                  const nextPage = pagination.current || 1;
                  const nextSize = pagination.pageSize || pageSize;
                  if (nextPage !== currentPage) setCurrentPage(nextPage);
                  if (nextSize !== pageSize) setPageSize(nextSize);
                  fetchReviewCaseList(nextPage, nextSize);
                }}
              />
            )}
            {!repositoryId && !loading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-custom-text-300">未找到用例库ID，请先在顶部选择一个用例库</div>
              </div>
            )}
          </div>
        </Col>
      </Row>
    </div>
  );
}
