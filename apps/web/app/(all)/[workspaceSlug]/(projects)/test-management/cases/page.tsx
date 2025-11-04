"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { PageHead } from "@/components/core/page-title";
import { Table, Tag, Input, Button, Space } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import type { TableProps, InputRef, TableColumnType } from "antd";
import type { FilterDropdownProps } from "antd/es/table/interface";
import { CaseService } from "@/services/qa/case.service";
import { formatDateTime, globalEnums } from "../util";
import { CreateCaseModal } from "@/components/qa/cases/create-modal";

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

type TestCaseResponse = {
  count: number;
  data: TestCase[];
};

export default function TestCasesPage() {
  const { workspaceSlug } = useParams();
  const repositoryId = typeof window !== "undefined" ? sessionStorage.getItem("selectedRepositoryId") : null;
  const repositoryName = typeof window !== "undefined" ? sessionStorage.getItem("selectedRepositoryName") : "";

  const [cases, setCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  // 分页状态管理
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);

  // 筛选状态管理
  const [filters, setFilters] = useState<{
    name?: string;
    state?: number[];
    type?: number[];
    priority?: number[];
  }>({});

  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef<InputRef>(null);

  const caseService = new CaseService();

  useEffect(() => {
    if (repositoryId) {
      fetchCases();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repositoryId]);

  // 搜索筛选函数（复用测试计划页面的实现）
  const getColumnSearchProps = (dataIndex: keyof TestCase | string): TableColumnType<TestCase> => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          ref={searchInput}
          placeholder={`搜索 ${dataIndex === "name" ? "名称" : "其他"}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys as string[], dataIndex, confirm)}
          style={{ marginBottom: 8, display: "block" }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys as string[], dataIndex, confirm)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            搜索
          </Button>
          <Button
            onClick={() => clearFilters && handleReset(clearFilters, dataIndex, confirm)}
            size="small"
            style={{ width: 90 }}
          >
            重置
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => <SearchOutlined style={{ color: filtered ? "#1677ff" : undefined }} />,
    onFilterDropdownOpenChange: (visible) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    },
    filteredValue: dataIndex === "name" ? (filters.name ? [filters.name] : null) : null,
  });

  const handleSearch = (selectedKeys: string[], dataIndex: keyof TestCase | string, confirm?: () => void) => {
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);

    const newFilters = { ...filters };
    if (selectedKeys[0]) {
      if (dataIndex === "name") newFilters.name = selectedKeys[0];
    } else {
      if (dataIndex === "name") delete newFilters.name;
    }

    setFilters(newFilters);
    confirm?.();
  };

  const handleReset = (clearFilters: () => void, dataIndex: keyof TestCase | string, confirm?: () => void) => {
    clearFilters();
    setSearchText("");

    const newFilters = { ...filters };
    if (dataIndex === "name") {
      delete newFilters.name;
    }

    setFilters(newFilters);
    confirm?.();
  };

  // 表格变更回调：统一处理分页与服务端过滤
  const handleTableChange: TableProps<TestCase>["onChange"] = (pagination, tableFilters) => {
    const selectedStates = (tableFilters?.state as number[] | undefined) || [];
    const selectedTypes = (tableFilters?.type as number[] | undefined) || [];
    const selectedPriorities = (tableFilters?.priority as number[] | undefined) || [];

    const newFilters = {
      ...filters,
      state: selectedStates.length ? selectedStates.map((v) => Number(v)) : undefined,
      type: selectedTypes.length ? selectedTypes.map((v) => Number(v)) : undefined,
      priority: selectedPriorities.length ? selectedPriorities.map((v) => Number(v)) : undefined,
    };

    const nextPage = pagination.current || 1;
    const nextPageSize = pagination.pageSize || pageSize;

    setCurrentPage(nextPage);
    setPageSize(nextPageSize);
    setFilters(newFilters);
    fetchCases(nextPage, nextPageSize, newFilters);
  };

  const fetchCases = async (
    page: number = currentPage,
    size: number = pageSize,
    filterParams: typeof filters = filters
  ) => {
    if (!workspaceSlug || !repositoryId) return;
    try {
      setLoading(true);
      setError(null);

      const queryParams: any = {
        page,
        page_size: size,
        repository_id: repositoryId,
      };

      // 名称模糊搜索
      if (filterParams.name) {
        queryParams.name__icontains = filterParams.name;
      }
      // 状态多选
      if (filterParams.state && filterParams.state.length > 0) {
        queryParams.state__in = filterParams.state.join(",");
      }
      // 类型多选
      if (filterParams.type && filterParams.type.length > 0) {
        queryParams.type__in = filterParams.type.join(",");
      }
      // 优先级多选
      if (filterParams.priority && filterParams.priority.length > 0) {
        queryParams.priority__in = filterParams.priority.join(",");
      }

      const response: TestCaseResponse = await caseService.getCases(workspaceSlug as string, queryParams);
      setCases(response?.data || []);
      setTotal(response?.count || 0);
      setCurrentPage(page);
      setPageSize(size);
    } catch (err) {
      console.error("获取测试用例数据失败:", err);
      setError("获取测试用例数据失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const handlePaginationChange = (page: number, size?: number) => {
    const newPageSize = size || pageSize;
    fetchCases(page, newPageSize, filters);
  };

  const handlePageSizeChange = (_current: number, size: number) => {
    fetchCases(1, size, filters);
  };

  const renderLabels = (labels?: TLabel[]) => {
    if (!labels || labels.length === 0) return <span className="text-custom-text-400">-</span>;
    return (
      <div className="flex flex-wrap gap-1">
        {labels.map((l, idx) => {
          const text = typeof l === "string" ? l : l?.name || "-";
          return (
            <Tag key={typeof l === "string" ? `${l}-${idx}` : `${(l?.id || idx).toString()}-${idx}`} color="cyan">
              {text}
            </Tag>
          );
        })}
      </div>
    );
  };

  // 根据全局枚举输出标签
  const getEnumLabel = (group: "case_state" | "case_type" | "case_priority", value?: number) => {
    if (value === null || value === undefined) return "-";
    const map = (globalEnums.Enums as any)?.[group] || {};
    const label = map[value] ?? map[String(value)] ?? value;
    return label;
  };

  const renderEnumTag = (
    group: "case_state" | "case_type" | "case_priority",
    value?: number,
    color: "default" | "processing" | "success" | "warning" | "magenta" = "default"
  ) => {
    const label = getEnumLabel(group, value);
    if (label === "-" || label === undefined) return <span className="text-custom-text-400">-</span>;
    return <Tag color={color}>{label}</Tag>;
  };

  const columns: TableProps<TestCase>["columns"] = [
    {
      title: "名称",
      dataIndex: "name",
      key: "name",
      ...getColumnSearchProps("name"),
    },
    {
      title: "状态",
      dataIndex: "state",
      key: "state",
      render: (v) => renderEnumTag("case_state", v, "processing"),
      width: 140,
      filters: Object.entries((globalEnums.Enums as any)?.case_state || {}).map(([value, label]) => ({
        text: String(label),
        value: Number(value),
      })),
      filterMultiple: true,
      filteredValue: filters.state ?? null,
    },
    {
      title: "类型",
      dataIndex: "type",
      key: "type",
      render: (v) => renderEnumTag("case_type", v, "magenta"),
      width: 140,
      filters: Object.entries((globalEnums.Enums as any)?.case_type || {}).map(([value, label]) => ({
        text: String(label),
        value: Number(value),
      })),
      filterMultiple: true,
      filteredValue: filters.type ?? null,
    },
    {
      title: "优先级",
      dataIndex: "priority",
      key: "priority",
      render: (v) => renderEnumTag("case_priority", v, "warning"),
      width: 120,
      filters: Object.entries((globalEnums.Enums as any)?.case_priority || {}).map(([value, label]) => ({
        text: String(label),
        value: Number(value),
      })),
      filterMultiple: true,
      filteredValue: filters.priority ?? null,
    },
    {
      title: "创建人",
      dataIndex: "created_by",
      key: "created_by",
      render: (creator: TCreator | undefined) => creator?.display_name || "-",
      width: 140,
    },
    { title: "创建时间", dataIndex: "created_at", key: "created_at", render: (d) => formatDateTime(d), width: 180 },
    { title: "更新时间", dataIndex: "updated_at", key: "updated_at", render: (d) => formatDateTime(d), width: 180 },
  ];

  return (
    <>
      {/* 页面标题 */}
      <PageHead title={`测试用例${repositoryName ? " - " + decodeURIComponent(repositoryName) : ""}`} />
      <div className="h-full w-full">
        <div className="flex h-full w-full flex-col">
          <div className="flex items-center justify-between gap-4 border-b border-custom-border-200 px-4 py-3 sm:px-5">
            <h3 className="text-lg font-medium">测试用例</h3>
            <div>
              <Button type="primary" onClick={() => setIsCreateModalOpen(true)} disabled={!repositoryId}>
                新增测试用例
              </Button>
            </div>
          </div>
          {/* 列表区域 */}
          <div className="flex-1 overflow-hidden p-4 sm:p-5">
            {/* 加载/错误/空状态 */}
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

            {!repositoryId && !loading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-custom-text-300">未找到用例库ID，请先在顶部选择一个用例库</div>
              </div>
            )}

            {repositoryId && !loading && !error && (
              <Table
                dataSource={cases}
                columns={columns}
                rowKey="id"
                bordered={true}
                onChange={handleTableChange}
                pagination={{
                  current: currentPage,
                  pageSize: pageSize,
                  total: total,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                  pageSizeOptions: ["10", "20", "50", "100"],
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* 新增/编辑用例弹窗（本次实现新增） */}
      {repositoryId && (
        <CreateCaseModal
          isOpen={isCreateModalOpen}
          handleClose={() => setIsCreateModalOpen(false)}
          workspaceSlug={workspaceSlug as string}
          repositoryId={repositoryId as string}
          repositoryName={decodeURIComponent(repositoryName || "")}
          onSuccess={async () => {
            // 新增成功后刷新当前列表与分页/筛选状态
            await fetchCases(currentPage, pageSize, filters);
          }}
        />
      )}
    </>
  );
}
